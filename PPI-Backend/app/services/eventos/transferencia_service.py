from __future__ import annotations

from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from app.core.exceptions import BusinessError, ServiceError

from app.repositories.eventos.transferencia_repository import (
    find_cliente_by_dni,
    get_entradas_de_emisor,
    entradas_ya_transferidas,
    resumen_por_evento_zona,
    mover_entradas,
    insert_transferencias,
)
from app.models.fidelizacion.registro_punto import RegistroPunto
from app.models.auth.cliente import Cliente
from app.schemas.eventos.transferencia import (
    TransferPreviewRequest,
    TransferPreviewResponse,
    TransferConfirmResponse,
    GrupoResumen,
)
from app.services.shared import CacheService


class TransferenciaService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def _get_puntos_por_entrada(self, entrada_id: int) -> int | None:
        """
        Retorna la suma de puntos de tipo 'Aumento' asociados a la entrada.
        Si no existe registro de aumento retorna None.
        """
        stmt = select(func.sum(RegistroPunto.cantidad_puntos)).where(
            RegistroPunto.entrada_id == entrada_id,
            RegistroPunto.tipo_registro == 'Aumento'
        )
        result = await self.db.execute(stmt)
        puntos = result.scalar_one_or_none()
        if puntos is None:
            return None
        return int(puntos)

    async def _create_decremento_registro(self, cliente_id: int, entrada_id: int, cantidad_puntos: int):
        registro = RegistroPunto(
            cliente_id=cliente_id,
            entrada_id=entrada_id,
            tipo_registro='Decremento',
            cantidad_puntos=cantidad_puntos,
            pago_id=None
        )
        self.db.add(registro)
        await self.db.flush()

    async def _update_cliente_puntos(self, cliente_id: int, cantidad_a_descontar: int):
        stmt = update(Cliente).where(
            Cliente.id == cliente_id
        ).values(
            puntos_disponibles=Cliente.puntos_disponibles - cantidad_a_descontar
        )
        await self.db.execute(stmt)

    async def _procesar_descuento_puntos(self, entrada_ids: list[int], emisor_id: int):
        total_puntos_descontados = 0
        for entrada_id in entrada_ids:
            puntos_entrada = await self._get_puntos_por_entrada(entrada_id)
            if puntos_entrada is not None and puntos_entrada > 0:
                await self._create_decremento_registro(emisor_id, entrada_id, puntos_entrada)
                total_puntos_descontados += puntos_entrada

        if total_puntos_descontados > 0:
            await self._update_cliente_puntos(emisor_id, total_puntos_descontados)

    async def _validate_and_prepare(self, req: TransferPreviewRequest) -> tuple[list[int], int, int]:
        if not req.entrada_ids:
            raise BusinessError("Debe enviar al menos una entrada.", 400)

        dest_id = await find_cliente_by_dni(self.db, req.destinatario_dni)
        if dest_id is None:
            raise BusinessError("Destinatario no encontrado por DNI.", 404)

        if dest_id == req.emisor_cliente_id:
            raise BusinessError("No puede transferirse a sí mismo.", 400)

        entradas = await get_entradas_de_emisor(self.db, req.entrada_ids, req.emisor_cliente_id, for_update=False)
        if len(entradas) != len(set(req.entrada_ids)):
            raise BusinessError("Una o más entradas no existen o no pertenecen al emisor.", 400)

        ya_tx = entradas_ya_transferidas(entradas)
        if ya_tx:
            raise BusinessError(f"Entradas ya transferidas: {ya_tx}", 409)

        entrada_ids_normalizados = [e["entrada_id"] for e in entradas]
        return entrada_ids_normalizados, req.emisor_cliente_id, dest_id
    
    async def preview_transfer(self, req: TransferPreviewRequest) -> TransferPreviewResponse:
        entrada_ids, _emisor_id, dest_id = await self._validate_and_prepare(req)

        grupos_db: List[Tuple[int, str | None, int, str | None, int]] = await resumen_por_evento_zona(self.db, entrada_ids)
        grupos: List[GrupoResumen] = [
            GrupoResumen(
                evento_id=g[0],
                evento_nombre=g[1],
                zona_id=g[2],
                zona_nombre=g[3],
                cantidad=g[4],
            )
            for g in grupos_db
        ]

        return TransferPreviewResponse(
            destinatario_cliente_id=dest_id,
            total=len(entrada_ids),
            grupos=grupos,
        )
    
    async def confirm_transfer(self, req: TransferPreviewRequest) -> TransferConfirmResponse:
        entrada_ids, emisor_id, dest_id = await self._validate_and_prepare(req)

        try:
            locked = await get_entradas_de_emisor(self.db, entrada_ids, emisor_id, for_update=True)
            if len(locked) != len(entrada_ids):
                raise BusinessError("Cambios concurrentes detectados.", 409)

            ya_tx = entradas_ya_transferidas(locked)
            if ya_tx:
                raise BusinessError(f"Entradas ya transferidas: {ya_tx}", 409)

            # Procesar descuento de puntos antes de la transferencia
            await self._procesar_descuento_puntos(entrada_ids, emisor_id)

            updated = await mover_entradas(self.db, entrada_ids, dest_id)
            if updated != len(entrada_ids):
                raise BusinessError("No se pudo actualizar todas las entradas.", 409)

            tx_ids = await insert_transferencias(self.db, entrada_ids, emisor_id, dest_id)

            await self.db.commit()
            return TransferConfirmResponse(transferidas=len(entrada_ids), transferencia_ids=tx_ids)

        except BusinessError:
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise ServiceError("Error al confirmar transferencia.", 500)
        finally:
            CacheService.safe_invalidate_async(
                CacheService.invalidate_cliente_entradas(emisor_id),
                'transfer_emisor_entradas'
            )
            CacheService.safe_invalidate_async(
                CacheService.invalidate_cliente_entradas(dest_id),
                'transfer_receptor_entradas'
            )

