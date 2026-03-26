from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker

# Base para los modelos SQLAlchemy
Base = declarative_base()

# Metadata para crear/eliminar tablas
metadata = MetaData()

# Función para crear todas las tablas
def create_tables(engine):
    """Crear todas las tablas definidas en los modelos"""
    Base.metadata.create_all(bind=engine)

# Función para eliminar todas las tablas  
def drop_tables(engine):
    """Eliminar todas las tablas"""
    Base.metadata.drop_all(bind=engine)