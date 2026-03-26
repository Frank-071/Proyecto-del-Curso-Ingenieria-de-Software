from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload
from app.models.auth.usuario import Usuario
from app.models.auth.cliente import Cliente
from app.repositories.base_repository import BaseRepository

class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Usuario)

    async def get_by_email(self, email: str):
        stmt = select(Usuario).options(
            joinedload(Usuario.administrador),
            joinedload(Usuario.cliente).joinedload(Cliente.rango)
        ).filter(Usuario.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id(self, id: int):
        stmt = select(Usuario).options(
            joinedload(Usuario.administrador),
            joinedload(Usuario.cliente).joinedload(Cliente.rango),
            joinedload(Usuario.tipo_documento)
        ).filter(Usuario.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_id_by_email(self, email: str) -> int | None:
        stmt = select(Usuario.id).filter(
            Usuario.email == email,
            Usuario.activo == True
        )
        result = await self.db.execute(stmt)
        row = result.first()
        return row[0] if row else None

    async def update_password(self, user_id: int, hashed_password: str) -> bool:
        stmt = update(Usuario).where(Usuario.id == user_id).values(contrasena=hashed_password)
        result = await self.db.execute(stmt)
        if result.rowcount == 0:
            return False
        await self.db.commit()
        return True

    async def exists_email(self, email: str) -> bool:
        result = await self.get_by_email(email)
        return result is not None

    async def find_by_email_or_document(self, email: str, numero_documento: str):
        stmt = select(Usuario).filter(
            (Usuario.email == email) | (Usuario.numero_documento == numero_documento)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_with_relations(self, id: int, obj_data: dict) -> Usuario:
        """Actualizar usuario y retornar con todas las relaciones cargadas"""
        # Actualizar usando UPDATE statement para mejor performance
        stmt = update(Usuario).where(Usuario.id == id).values(**obj_data)
        result = await self.db.execute(stmt)
        
        if result.rowcount == 0:
            raise ValueError(f"Usuario con ID {id} no encontrado")
        
        await self.db.commit()
        
        # Obtener el usuario actualizado con todas las relaciones
        return await self.get_by_id(id)
