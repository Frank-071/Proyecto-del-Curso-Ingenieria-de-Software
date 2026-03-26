from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app.models.usuarios.usuario import Usuario
from app.repositories.base_repository import BaseRepository


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Usuario)

    async def get_by_id(self, id: int) -> Optional[Usuario]:
        stmt = select(Usuario).filter(Usuario.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Usuario]:
        stmt = select(Usuario).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_filtered(
        self,
        skip: int = 0,
        limit: int = 10,
        activo: Optional[bool] = None,
        busqueda: Optional[str] = None
    ) -> List[Usuario]:

        stmt = select(Usuario)

        conditions = []

        if activo is not None:
            conditions.append(Usuario.activo == activo)

        if busqueda:
            busqueda_clean = f"%{busqueda.strip()}%"
            conditions.append(
                and_(
                    Usuario.nombres.ilike(busqueda_clean)
                    | Usuario.apellidos.ilike(busqueda_clean)
                    | Usuario.email.ilike(busqueda_clean)
                    | Usuario.numero_documento.ilike(busqueda_clean)
                )
            )

        if conditions:
            stmt = stmt.filter(and_(*conditions))

        stmt = stmt.order_by(Usuario.fecha_creacion.desc())
        stmt = stmt.offset(skip).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_filtered(
        self,
        activo: Optional[bool] = None,
        busqueda: Optional[str] = None
    ) -> int:
        
        conditions = []

        if activo is not None:
            conditions.append(Usuario.activo == activo)

        if busqueda:
            busqueda_clean = f"%{busqueda.strip()}%"
            conditions.append(
                and_(
                    Usuario.nombres.ilike(busqueda_clean)
                    | Usuario.apellidos.ilike(busqueda_clean)
                    | Usuario.email.ilike(busqueda_clean)
                    | Usuario.numero_documento.ilike(busqueda_clean)
                )
            )

        stmt = select(func.count()).select_from(Usuario)

        if conditions:
            stmt = stmt.filter(and_(*conditions))

        result = await self.db.execute(stmt)
        return result.scalar()

    async def bulk_create(self, usuarios_data: List[dict]) -> List[Usuario]:
        """Crea múltiples usuarios en batch."""
        try:
            usuarios_creados = []

            for user_data in usuarios_data:
                db_usuario = Usuario(**user_data)
                self.db.add(db_usuario)
                usuarios_creados.append(db_usuario)

            await self.db.commit()

            # Refrescar IDs generados
            for usuario in usuarios_creados:
                await self.db.refresh(usuario)

            return usuarios_creados

        except SQLAlchemyError:
            await self.db.rollback()
            raise

    async def get_existing_emails(self, emails: List[str]) -> set:
        """Retorna emails que ya existen para prevenir duplicados."""
        stmt = select(Usuario.email).filter(Usuario.email.in_(emails))
        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}

    async def get_existing_documentos(self, documentos: List[str]) -> set:
        """Retorna documentos existentes para validar duplicados."""
        stmt = select(Usuario.numero_documento).filter(Usuario.numero_documento.in_(documentos))
        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}
