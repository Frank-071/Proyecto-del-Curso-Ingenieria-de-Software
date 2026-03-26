from sqlalchemy import Column, Integer, DateTime, SmallInteger, Text, ForeignKey, TIMESTAMP, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base


class Notificacion(Base):
    __tablename__ = 'Notificaciones'
    __table_args__ = (
        Index('idx_notificaciones_status_notifyat', 'status', 'notify_at'),
        Index('idx_notificaciones_status_notifyend', 'status', 'notify_end'),
    )

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    entrada_id = Column(Integer, ForeignKey('Entradas.entrada_id'), nullable=False, index=True)
    cliente_id = Column(Integer, ForeignKey('Clientes.cliente_id'), nullable=False, index=True)
    zona_id = Column(Integer, ForeignKey('Zonas.zona_id'), nullable=True, index=True)
    evento_id = Column(Integer, ForeignKey('Eventos.evento_id'), nullable=True, index=True)

    notify_at = Column(DateTime, nullable=True)
    notify_end = Column(DateTime, nullable=True)

    status = Column(SmallInteger, nullable=False, default=0)
    max_attempts = Column(SmallInteger, nullable=False, default=5)
    attempts = Column(SmallInteger, nullable=False, default=0)
    last_error = Column(Text, nullable=True)

    processed_at = Column(DateTime, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    entrada = relationship('Entrada', backref='notificaciones', lazy='selectin')
    cliente = relationship('Cliente', lazy='selectin')
    evento = relationship('Evento', lazy='selectin')
