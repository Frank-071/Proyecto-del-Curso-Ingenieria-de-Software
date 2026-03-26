from abc import ABC
from typing import Generic, TypeVar, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select, func

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    
    def __init__(self, db: AsyncSession, model_class: type[T], active_field: str = 'activo'):
        self.db = db
        self.model_class = model_class
        self.active_field = active_field
    
    async def get_by_id(self, id: int) -> T:
        stmt = select(self.model_class).filter(self.model_class.id == id)
        
        if self.active_field:
            active_attr = getattr(self.model_class, self.active_field)
            stmt = stmt.filter(active_attr == True)
        
        result = await self.db.execute(stmt)
        obj = result.scalar_one_or_none()
        
        if obj is None:
            raise ValueError(f"{self.model_class.__name__} con ID {id} no encontrado")
        return obj
    
    async def get_by_id_all(self, id: int) -> Optional[T]:
        stmt = select(self.model_class).filter(self.model_class.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        stmt = select(self.model_class)
        
        if self.active_field:
            active_attr = getattr(self.model_class, self.active_field)
            stmt = stmt.filter(active_attr == True)
        
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_all_records(self, skip: int = 0, limit: int = 100) -> List[T]:
        stmt = select(self.model_class).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def create(self, obj_data: dict) -> T:
        try:
            db_obj = self.model_class(**obj_data)
            self.db.add(db_obj)
            await self.db.commit()
            await self.db.refresh(db_obj)
            return db_obj
            
        except SQLAlchemyError:
            await self.db.rollback()
            raise
    
    async def update(self, id: int, obj_data: dict) -> T:
        db_obj = await self.get_by_id_all(id)
        if db_obj is None:
            raise ValueError(f"{self.model_class.__name__} con ID {id} no encontrado")
        
        try:
            for field, value in obj_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
                    
            await self.db.commit()
            await self.db.refresh(db_obj)
            return db_obj
            
        except SQLAlchemyError:
            await self.db.rollback()
            raise
    
    async def delete(self, id: int) -> bool:
        if not self.active_field:
            raise ValueError("La entidad no soporta eliminación lógica")
            
        db_obj = await self.get_by_id(id)
        
        try:
            setattr(db_obj, self.active_field, False)
            await self.db.commit()
            return True
            
        except SQLAlchemyError:
            await self.db.rollback()
            raise
    
    async def delete_physical(self, id: int) -> bool:
        """Eliminación física del registro de la base de datos"""
        db_obj = await self.get_by_id_all(id)
        if db_obj is None:
            raise ValueError(f"{self.model_class.__name__} con ID {id} no encontrado")
        
        try:
            await self.db.delete(db_obj)
            await self.db.commit()
            return True
            
        except SQLAlchemyError:
            await self.db.rollback()
            raise

    
    async def exists(self, id: int) -> bool:
        stmt = select(self.model_class.id).filter(self.model_class.id == id)
        
        if self.active_field:
            active_attr = getattr(self.model_class, self.active_field)
            stmt = stmt.filter(active_attr == True)
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None
    
    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model_class)
        
        if self.active_field:
            active_attr = getattr(self.model_class, self.active_field)
            stmt = stmt.filter(active_attr == True)
        
        result = await self.db.execute(stmt)
        return result.scalar()
    
    async def count_all(self) -> int:
        stmt = select(func.count()).select_from(self.model_class)
        result = await self.db.execute(stmt)
        return result.scalar()