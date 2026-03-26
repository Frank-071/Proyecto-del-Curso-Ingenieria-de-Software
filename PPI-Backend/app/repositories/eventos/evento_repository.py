from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
from datetime import datetime
from app.models import Evento, Local, Distrito, Provincia, Departamento
from app.repositories.base_repository import BaseRepository


class EventoRepository(BaseRepository[Evento]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Evento)
    
    async def get_by_id(self, id: int) -> Evento:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Evento).filter(Evento.id == id, Evento.activo == True).options(
            joinedload(Evento.local).joinedload(Local.distrito),
            joinedload(Evento.local).joinedload(Local.tipo_local),
            joinedload(Evento.organizador),
            joinedload(Evento.categoria_evento),
            joinedload(Evento.administrador),
            selectinload(Evento.zonas)
        )
        result = await self.db.execute(stmt)
        obj = result.unique().scalar_one_or_none()
        
        if obj is None:
            raise ValueError(f"Evento con ID {id} no encontrado")
        return obj
    
    async def get_by_id_all(self, id: int) -> Optional[Evento]:
        """Override para cargar relaciones necesarias (eager loading)"""
        stmt = select(Evento).filter(Evento.id == id).options(
            joinedload(Evento.local).joinedload(Local.distrito),
            joinedload(Evento.local).joinedload(Local.tipo_local),
            joinedload(Evento.organizador),
            joinedload(Evento.categoria_evento),
            joinedload(Evento.administrador),
            selectinload(Evento.zonas)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()

    async def get_by_id_with_organizador(self, evento_id: int) -> Optional[Evento]:
        stmt = select(Evento).options(
            joinedload(Evento.organizador)
        ).filter(Evento.id == evento_id)
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()
    
    async def get_all_with_local(self, skip: int = 0, limit: int = 10) -> List[Evento]:
        stmt = select(Evento).options(
            joinedload(Evento.local)
        ).filter(
            Evento.activo == True
        ).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())
    
    async def get_all_with_local_public(
        self, 
        skip: int = 0, 
        limit: int = 10,
        categoria_id: Optional[int] = None,
        distrito_id: Optional[int] = None,
        fecha_inicio: Optional[datetime] = None,
        busqueda: Optional[str] = None
    ) -> List[Evento]:
        stmt = select(Evento).options(
            joinedload(Evento.local),
            joinedload(Evento.categoria_evento)
        )
        
        conditions = [
            Evento.activo == True,
            Evento.estado.in_(["Publicado", "Proximamente"])
        ]
        
        if categoria_id is not None:
            conditions.append(Evento.categoria_evento_id == categoria_id)
        
        if distrito_id is not None:
            # JOIN con Local para filtrar por distrito
            stmt = stmt.join(Local, Evento.local_id == Local.id)
            conditions.append(Local.distrito_id == distrito_id)
        
        if fecha_inicio:
            # Filtrar eventos que ocurran exactamente en la fecha seleccionada (ignorar hora)
            conditions.append(func.date(Evento.fecha_hora_inicio) == fecha_inicio.date())
        
        if busqueda:
            busqueda_clean = busqueda.strip()
            conditions.append(
                text(
                    "MATCH(Eventos.nombre, Eventos.descripcion) AGAINST(:busqueda IN BOOLEAN MODE)"
                ).bindparams(busqueda=f"{busqueda_clean}*")
            )
        
        stmt = stmt.filter(and_(*conditions))
        stmt = stmt.order_by(Evento.fecha_hora_inicio.asc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())
    
    async def get_by_id_with_zonas_all(self, evento_id: int) -> Optional[Evento]:
        stmt = select(Evento).options(
            joinedload(Evento.zonas),
            joinedload(Evento.local).joinedload(Local.distrito).joinedload(Distrito.provincia).joinedload(Provincia.departamento),
            joinedload(Evento.organizador),
            joinedload(Evento.categoria_evento),    
            joinedload(Evento.administrador)
        ).filter(
            Evento.id == evento_id
        )
        result = await self.db.execute(stmt)
        return result.unique().scalar_one_or_none()
    
    async def get_by_categoria(self, categoria_id: int) -> List[Evento]:
        stmt = select(Evento).filter(
            Evento.categoria_evento_id == categoria_id,
            Evento.activo == True
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_local(self, local_id: int) -> List[Evento]:
        stmt = select(Evento).filter(
            Evento.local_id == local_id,
            Evento.activo == True
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_estado(self, estado: str) -> List[Evento]:
        stmt = select(Evento).filter(
            Evento.estado == estado,
            Evento.activo == True
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def count_publicados(self) -> int:
        stmt = select(func.count()).select_from(Evento).filter(
            Evento.estado == "Publicado",
            Evento.activo == True
        )
        result = await self.db.execute(stmt)
        return result.scalar()
    
    async def get_all_filtered(
        self,
        skip: int = 0,
        limit: int = 10,
        categoria_id: Optional[int] = None,
        estado: Optional[str] = None,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None,
        busqueda: Optional[str] = None
    ) -> List[Evento]:
        stmt = select(Evento).options(
            joinedload(Evento.local)
        )
        
        conditions = []
        
        if categoria_id is not None:
            conditions.append(Evento.categoria_evento_id == categoria_id)
        
        if estado is not None:
            conditions.append(Evento.estado == estado)
        
        if fecha_inicio and fecha_fin:
            conditions.append(
                and_(
                    Evento.fecha_hora_inicio >= fecha_inicio,
                    Evento.fecha_hora_inicio <= fecha_fin
                )
            )
        
        if busqueda:
            busqueda_clean = busqueda.strip()
            conditions.append(
                text(
                    "MATCH(Eventos.nombre, Eventos.descripcion) AGAINST(:busqueda IN BOOLEAN MODE)"
                ).bindparams(busqueda=f"{busqueda_clean}*")
            )
        
        if conditions:
            stmt = stmt.filter(and_(*conditions))
        
        stmt = stmt.order_by(Evento.fecha_hora_inicio.asc())
        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.unique().scalars().all())
    
    async def count_filtered(
        self,
        categoria_id: Optional[int] = None,
        estado: Optional[str] = None,
        fecha_inicio: Optional[datetime] = None,
        fecha_fin: Optional[datetime] = None,
        busqueda: Optional[str] = None
    ) -> int:
        conditions = []
        
        if categoria_id is not None:
            conditions.append(Evento.categoria_evento_id == categoria_id)
        
        if estado is not None:
            conditions.append(Evento.estado == estado)
        
        if fecha_inicio and fecha_fin:
            conditions.append(
                and_(
                    Evento.fecha_hora_inicio >= fecha_inicio,
                    Evento.fecha_hora_inicio <= fecha_fin
                )
            )
        
        if busqueda:
            busqueda_clean = busqueda.strip()
            conditions.append(
                text(
                    "MATCH(Eventos.nombre, Eventos.descripcion) AGAINST(:busqueda IN BOOLEAN MODE)"
                ).bindparams(busqueda=f"{busqueda_clean}*")
            )
        
        stmt = select(func.count()).select_from(Evento)
        
        if conditions:
            stmt = stmt.filter(and_(*conditions))
        
        result = await self.db.execute(stmt)
        return result.scalar()
    
    async def count_public_filtered(
        self,
        categoria_id: Optional[int] = None,
        distrito_id: Optional[int] = None,
        fecha_inicio: Optional[datetime] = None,
        busqueda: Optional[str] = None
    ) -> int:
        conditions = [
            Evento.activo == True,
            Evento.estado.in_(["Publicado", "Proximamente"])
        ]
        
        if categoria_id is not None:
            conditions.append(Evento.categoria_evento_id == categoria_id)
        
        stmt = select(func.count()).select_from(Evento)
        
        if distrito_id is not None:
            # JOIN con Local para filtrar por distrito
            stmt = stmt.join(Local, Evento.local_id == Local.id)
            conditions.append(Local.distrito_id == distrito_id)
        
        if fecha_inicio:
            # Filtrar eventos que ocurran exactamente en la fecha seleccionada (ignorar hora)
            conditions.append(func.date(Evento.fecha_hora_inicio) == fecha_inicio.date())
        
        if busqueda:
            busqueda_clean = busqueda.strip()
            conditions.append(
                text(
                    "MATCH(Eventos.nombre, Eventos.descripcion) AGAINST(:busqueda IN BOOLEAN MODE)"
                ).bindparams(busqueda=f"{busqueda_clean}*")
            )
        
        if conditions:
            stmt = stmt.filter(and_(*conditions))
        
        result = await self.db.execute(stmt)
        return result.scalar()

