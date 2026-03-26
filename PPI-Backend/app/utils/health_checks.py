from datetime import datetime
from sqlalchemy import text
from app.database.connection import engine
from app.core.infrastructure import redis_client
import logging
import aioboto3
import os
from botocore.exceptions import ClientError, ReadTimeoutError, ConnectTimeoutError
from botocore.config import Config

logger = logging.getLogger(__name__)

async def check_database() -> dict:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return {"status": "healthy", "message": "Database connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "message": str(e)}

async def check_redis() -> dict:
    try:
        if await redis_client.is_connected():
            await redis_client.client.ping()
            return {"status": "healthy", "message": "Redis connected"}
        else:
            return {"status": "unhealthy", "message": "Redis not initialized"}
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {"status": "unhealthy", "message": str(e)}

async def check_s3() -> dict:
    try:
        bucket_name = os.getenv("AWS_S3_BUCKET")
        region = os.getenv("AWS_REGION")
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        
        if not all([bucket_name, region, aws_access_key_id, aws_secret_access_key]):
            return {"status": "unhealthy", "message": "S3 credentials not configured"}
        
        health_check_config = Config(
            connect_timeout=2,
            read_timeout=3,
            retries={'max_attempts': 1}
        )
        
        session = aioboto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region
        )
        
        async with session.client('s3', config=health_check_config) as s3_client:
            await s3_client.head_bucket(Bucket=bucket_name)
        
        return {"status": "healthy", "message": "S3 accessible"}
    except (ReadTimeoutError, ConnectTimeoutError) as e:
        logger.warning(f"S3 health check timeout: {e}")
        return {"status": "unhealthy", "message": "S3 timeout"}
    except ClientError as e:
        logger.error(f"S3 health check failed: {e}")
        return {"status": "unhealthy", "message": str(e)}
    except Exception as e:
        logger.error(f"S3 health check failed: {e}")
        return {"status": "unhealthy", "message": str(e)}

