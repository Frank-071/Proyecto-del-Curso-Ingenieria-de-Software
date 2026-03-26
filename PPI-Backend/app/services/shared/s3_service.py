import aioboto3
from botocore.exceptions import ClientError, BotoCoreError, ReadTimeoutError, ConnectTimeoutError
from botocore.config import Config
import os
from dotenv import load_dotenv
from PIL import Image
import io
import asyncio
from typing import Dict, Tuple, Optional, Union
from fastapi import UploadFile
from app.core.exceptions import ServiceError
import logging

load_dotenv()

logger = logging.getLogger(__name__)

MAX_FILE_SIZE: int = 10 * 1024 * 1024

class S3Service:
    def __init__(self) -> None:
        self.bucket_name: Optional[str] = os.getenv("AWS_S3_BUCKET")
        self.region: Optional[str] = os.getenv("AWS_REGION")
        self.aws_access_key_id: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_access_key: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        if not self.aws_access_key_id or not self.aws_secret_access_key:
            raise ServiceError("Fallaron las credenciales de AWS.", 500)
        
        if not self.bucket_name or not self.region:
            raise ServiceError("Fallaron la configuración de AWS.", 500)
        
        # Configuración de timeouts para S3
        # connect_timeout: tiempo máximo para establecer conexión (5s)
        # read_timeout: tiempo máximo para upload/download (30s para 10MB)
        # max_attempts: reintentos automáticos en caso de errores transitorios
        self.s3_config = Config(
            connect_timeout=5,
            read_timeout=30,
            retries={
                'max_attempts': 3,
                'mode': 'adaptive'
            }
        )
        
        # Configuración más agresiva para operaciones rápidas (delete, presigned URL)
        self.s3_config_fast = Config(
            connect_timeout=5,
            read_timeout=10,
            retries={
                'max_attempts': 2,
                'mode': 'adaptive'
            }
        )
        
        self.session: aioboto3.Session = aioboto3.Session(
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.region
        )
    
    def _validate_file_size(self, file: UploadFile) -> int:
        file.file.seek(0, 2)
        file_size: int = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise ServiceError(f"Archivo muy grande. Máximo {MAX_FILE_SIZE // (1024 * 1024)}MB", 400)
        
        return file_size
    
    async def _compress_image(self, file: UploadFile, max_size: Tuple[int, int] = (500, 500), quality: int = 85) -> io.BytesIO:
        try:
            file.file.seek(0)
            image_data: Image.Image = await asyncio.to_thread(Image.open, file.file)
            
            if image_data.mode in ('RGBA', 'LA', 'P'):
                image_data = image_data.convert('RGB')
            
            image_data.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            output: io.BytesIO = io.BytesIO()
            await asyncio.to_thread(image_data.save, output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)
            
            return output
        except Image.UnidentifiedImageError:
            raise ServiceError("El archivo no es una imagen válida.", 400)
        except OSError as e:
            raise ServiceError(f"Error al leer el archivo: {str(e)}", 400)
        except Exception as e:
            raise ServiceError(f"Error al comprimir imagen: {str(e)}", 500)

    async def upload_file(self, file: UploadFile, folder: str, user_id: Optional[str] = None) -> Dict[str, str]:
        try:
            self._validate_file_size(file)
            
            file_extension: str = 'jpg'
            simple_filename: str = f"usuario_{user_id}.{file_extension}"
            s3_key: str = f"{folder}/{simple_filename}"
            
            compressed_file: io.BytesIO = await self._compress_image(file)
            
            async with self.session.client('s3', config=self.s3_config) as s3_client:
                await s3_client.upload_fileobj(
                    compressed_file,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': 'image/jpeg'
                    }
                )
            
            file_url: str = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
            return {
                "url": file_url,
                "key": s3_key,
                "filename": simple_filename
            }
        except (ReadTimeoutError, ConnectTimeoutError) as e:
            logger.error(f"Timeout subiendo archivo a S3: {str(e)}")
            raise ServiceError("Timeout subiendo archivo. El servidor de almacenamiento no responde, intenta de nuevo.", 504)
        except ClientError as e:
            logger.error(f"Error de S3 subiendo archivo: {str(e)}")
            raise ServiceError(f"Error subiendo archivo: {str(e)}", 500)
        except BotoCoreError as e:
            logger.error(f"Error de conexión con S3: {str(e)}")
            raise ServiceError("Error de conexión con el servidor de almacenamiento.", 500)

    async def upload_evento_file(self, file: UploadFile, folder: str, evento_id: str, compress: bool = True) -> Dict[str, str]:
        try:
            self._validate_file_size(file)
            
            file_extension: str = 'jpg'
            simple_filename: str = f"evento_{evento_id}.{file_extension}"
            s3_key: str = f"{folder}/{simple_filename}"
            
            file_to_upload: Union[io.BytesIO, io.BufferedReader]
            if compress:
                file_to_upload = await self._compress_image(file)
            else:
                file.file.seek(0)
                file_to_upload = file.file
            
            async with self.session.client('s3', config=self.s3_config) as s3_client:
                await s3_client.upload_fileobj(
                    file_to_upload,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': 'image/jpeg'
                    }
                )
            
            file_url: str = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
            return {
                "url": file_url,
                "key": s3_key,
                "filename": simple_filename
            }
        except (ReadTimeoutError, ConnectTimeoutError) as e:
            logger.error(f"Timeout subiendo archivo de evento a S3: {str(e)}")
            raise ServiceError("Timeout subiendo archivo. El servidor de almacenamiento no responde, intenta de nuevo.", 504)
        except ClientError as e:
            logger.error(f"Error de S3 subiendo archivo de evento: {str(e)}")
            raise ServiceError(f"Error subiendo archivo: {str(e)}", 500)
        except BotoCoreError as e:
            logger.error(f"Error de conexión con S3: {str(e)}")
            raise ServiceError("Error de conexión con el servidor de almacenamiento.", 500)

    
    async def delete_file(self, s3_key: str) -> Dict[str, str]:
        try:
            async with self.session.client('s3', config=self.s3_config_fast) as s3_client:
                await s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return {"message": "Archivo eliminado correctamente"}
        except (ReadTimeoutError, ConnectTimeoutError) as e:
            logger.error(f"Timeout eliminando archivo de S3: {str(e)}")
            raise ServiceError("Timeout eliminando archivo. El servidor de almacenamiento no responde, intenta de nuevo.", 504)
        except ClientError as e:
            logger.error(f"Error de S3 eliminando archivo: {str(e)}")
            raise ServiceError(f"Error eliminando archivo: {str(e)}", 500)
        except BotoCoreError as e:
            logger.error(f"Error de conexión con S3: {str(e)}")
            raise ServiceError("Error de conexión con el servidor de almacenamiento.", 500)
    
    async def upload_entrada_pdf(self, pdf_bytes: bytes, entrada_id: int) -> Dict[str, str]:
        try:
            s3_key = f"entradas/entrada_{entrada_id}.pdf"
            pdf_buffer = io.BytesIO(pdf_bytes)
            
            async with self.session.client('s3', config=self.s3_config) as s3_client:
                await s3_client.upload_fileobj(
                    pdf_buffer,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': 'application/pdf'
                    }
                )
            
            file_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_key}"
            return {
                "url": file_url,
                "key": s3_key,
                "filename": f"entrada_{entrada_id}.pdf"
            }
        except (ReadTimeoutError, ConnectTimeoutError) as e:
            logger.error(f"Timeout subiendo PDF de entrada a S3: {str(e)}")
            raise ServiceError("Timeout subiendo PDF. El servidor de almacenamiento no responde, intenta de nuevo.", 504)
        except ClientError as e:
            logger.error(f"Error de S3 subiendo PDF de entrada: {str(e)}")
            raise ServiceError(f"Error subiendo PDF: {str(e)}", 500)
        except BotoCoreError as e:
            logger.error(f"Error de conexión con S3: {str(e)}")
            raise ServiceError("Error de conexión con el servidor de almacenamiento.", 500)
    
    async def get_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        try:
            async with self.session.client('s3', config=self.s3_config_fast) as s3_client:
                response: str = await s3_client.generate_presigned_url(
                    'put_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=expiration
                )
            return response
        except (ReadTimeoutError, ConnectTimeoutError) as e:
            logger.error(f"Timeout generando URL presigned de S3: {str(e)}")
            raise ServiceError("Timeout generando URL. El servidor de almacenamiento no responde, intenta de nuevo.", 504)
        except ClientError as e:
            logger.error(f"Error de S3 generando URL presigned: {str(e)}")
            raise ServiceError(f"Error generando URL: {str(e)}", 500)
        except BotoCoreError as e:
            logger.error(f"Error de conexión con S3: {str(e)}")
            raise ServiceError("Error de conexión con el servidor de almacenamiento.", 500)
    
    async def get_presigned_url_download(self, s3_key: str, expiration: int = 3600) -> str:
        try:
            async with self.session.client('s3', config=self.s3_config_fast) as s3_client:
                response: str = await s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': s3_key},
                    ExpiresIn=expiration
                )
            return response
        except (ReadTimeoutError, ConnectTimeoutError) as e:
            logger.error(f"Timeout generando URL presigned de descarga de S3: {str(e)}")
            raise ServiceError("Timeout generando URL. El servidor de almacenamiento no responde, intenta de nuevo.", 504)
        except ClientError as e:
            logger.error(f"Error de S3 generando URL presigned de descarga: {str(e)}")
            raise ServiceError(f"Error generando URL: {str(e)}", 500)
        except BotoCoreError as e:
            logger.error(f"Error de conexión con S3: {str(e)}")
            raise ServiceError("Error de conexión con el servidor de almacenamiento.", 500)
    
    async def pdf_exists(self, entrada_id: int) -> bool:
        """Verifica si un PDF existe en S3"""
        try:
            s3_key = f"entradas/entrada_{entrada_id}.pdf"
            async with self.session.client('s3', config=self.s3_config_fast) as s3_client:
                await s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=s3_key
                )
            return True
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == '404' or error_code == 'NoSuchKey':
                return False
            logger.error(f"Error verificando existencia de PDF en S3: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error verificando existencia de PDF: {str(e)}")
            return False

