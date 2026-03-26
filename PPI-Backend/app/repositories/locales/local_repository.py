from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict
from app.models.locales.local import Local
from app.models.geografia.distrito import Distrito
from app.models.geografia.provincia import Provincia
from app.repositories.base_repository import BaseRepository


class LocalRepository(BaseRepository[Local]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Local)
    
    async def get_by_id_all(self, id: int) -> Optional[Local]:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Local).filter(Local.id == id).options(
            joinedload(Local.distrito),
            joinedload(Local.tipo_local)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()
    
    async def get_by_distrito_id(self, distrito_id: int) -> List[Local]:
        stmt = select(Local).filter(Local.distrito_id == distrito_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_all_with_relations(self, skip: int = 0, limit: int = 100) -> List[Local]:
        stmt = select(Local).options(
            joinedload(Local.distrito),
            joinedload(Local.tipo_local)
        ).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())
    
    async def get_by_id_with_relations(self, local_id: int) -> Optional[Local]:
        stmt = select(Local).options(
            joinedload(Local.distrito),
            joinedload(Local.tipo_local)
        ).filter(Local.id == local_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all_filtered(
        self,
        skip: int = 0,
        limit: int = 10,
        tipo_local_id: Optional[int] = None,
        activo: Optional[bool] = None,
        distrito_id: Optional[int] = None,
        busqueda: Optional[str] = None
    ) -> List[Local]:
        stmt = select(Local).options(
            joinedload(Local.distrito),
            joinedload(Local.tipo_local)
        )
        
        conditions = []
        
        if tipo_local_id is not None:
            conditions.append(Local.tipo_local_id == tipo_local_id)
        
        if activo is not None:
            conditions.append(Local.activo == activo)
        
        if distrito_id is not None:
            conditions.append(Local.distrito_id == distrito_id)
        
        if busqueda:
            from sqlalchemy import text
            
            busqueda_clean = busqueda.strip()
            conditions.append(
                text(
                    "MATCH(Locales.nombre, Locales.direccion) AGAINST(:busqueda IN BOOLEAN MODE)"
                ).bindparams(busqueda=f"{busqueda_clean}*")
            )
        
        if conditions:
            stmt = stmt.filter(and_(*conditions))
        
        stmt = stmt.order_by(Local.fecha_creacion.desc())
        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())
    
    async def count_filtered(
        self,
        tipo_local_id: Optional[int] = None,
        activo: Optional[bool] = None,
        distrito_id: Optional[int] = None,
        busqueda: Optional[str] = None
    ) -> int:
        conditions = []
        
        if tipo_local_id is not None:
            conditions.append(Local.tipo_local_id == tipo_local_id)
        
        if activo is not None:
            conditions.append(Local.activo == activo)
        
        if distrito_id is not None:
            conditions.append(Local.distrito_id == distrito_id)
        
        if busqueda:
            from sqlalchemy import text
            
            busqueda_clean = busqueda.strip()
            conditions.append(
                text(
                    "MATCH(Locales.nombre, Locales.direccion) AGAINST(:busqueda IN BOOLEAN MODE)"
                ).bindparams(busqueda=f"{busqueda_clean}*")
            )
        
        stmt = select(func.count()).select_from(Local)
        
        if conditions:
            stmt = stmt.filter(and_(*conditions))
        
        result = await self.db.execute(stmt)
        return result.scalar()

    async def list_where_lat_null(self, skip: int = 0, limit: int = 100) -> List[Local]:
        stmt = select(Local).options(
            joinedload(Local.distrito).joinedload(Distrito.provincia).joinedload(Provincia.departamento),
            joinedload(Local.tipo_local)
        ).filter(
            (Local.latitud == None) | (Local.longitud == None)  # noqa: E711
        ).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())

    async def list_by_bbox(
        self,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
        skip: int = 0,
        limit: int = 100
    ) -> List[Local]:
        stmt = select(Local).options(
            joinedload(Local.distrito).joinedload(Distrito.provincia).joinedload(Provincia.departamento),
            joinedload(Local.tipo_local)
        ).filter(
            Local.latitud >= min_lat,
            Local.latitud <= max_lat,
            Local.longitud >= min_lng,
            Local.longitud <= max_lng
        ).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())
    
    async def bulk_create(self, locales_data: List[Dict]) -> List[Local]:
        """Crea múltiples locales en una sola transacción"""
        try:
            locales_creados = []
            for local_data in locales_data:
                db_local = Local(**local_data)
                self.db.add(db_local)
                locales_creados.append(db_local)
            
            await self.db.commit()
            
            # Refresh para obtener IDs generados
            for local in locales_creados:
                await self.db.refresh(local)
            
            return locales_creados
        except SQLAlchemyError:
            await self.db.rollback()
            raise
    
    async def get_existing_direcciones(self, direcciones: List[str]) -> set:
        """Obtiene las direcciones que ya existen en la BD (para detectar duplicados)"""
        stmt = select(Local.direccion).filter(Local.direccion.in_(direcciones))
        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}
    
    async def validate_tipos_local_ids(self, tipo_local_ids: List[int]) -> set:
        """Valida qué tipos_local_id existen en la BD (validación en batch)"""
        from app.models.locales.tipo_local import TipoLocal
        stmt = select(TipoLocal.id).filter(TipoLocal.id.in_(tipo_local_ids))
        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}
    
    async def validate_distrito_ids(self, distrito_ids: List[int]) -> set:
        """Valida qué distrito_ids existen en la BD (validación en batch)"""
        from app.models.geografia.distrito import Distrito
        stmt = select(Distrito.id).filter(Distrito.id.in_(distrito_ids))
        result = await self.db.execute(stmt)
        return {row[0] for row in result.all()}

