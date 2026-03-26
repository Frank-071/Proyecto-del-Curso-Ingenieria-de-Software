# app/repositories/eventos/transferencia_repository.py
from __future__ import annotations

from typing import Iterable, List, Optional, Tuple, TypedDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, bindparam


class EntradaRow(TypedDict, total=False):
    entrada_id: int
    cliente_id: int
    zona_id: int
    fue_transferida: Optional[int]


async def find_cliente_by_dni(db: AsyncSession, dni: str) -> Optional[int]:
    sql = text(
        """
        SELECT c.cliente_id
        FROM Clientes c
        JOIN Usuarios u ON u.usuario_id = c.cliente_id
        WHERE u.numero_documento = :dni
        LIMIT 1
        """
    )
    result = await db.execute(sql, {"dni": dni})
    row = result.first()
    return int(row[0]) if row else None


def _select_entradas_emisor_sql(for_update: bool) -> str:
    suffix = " FOR UPDATE" if for_update else ""
    return (
        f"""
        SELECT e.entrada_id, e.cliente_id, e.zona_id, e.fue_transferida
        FROM Entradas e
        WHERE e.entrada_id IN :ids
          AND e.cliente_id = :emisor_id
        {suffix}
        """
    )


async def get_entradas_de_emisor(
    db: AsyncSession, entrada_ids: Iterable[int], emisor_id: int, for_update: bool = False
) -> List[EntradaRow]:
    ids = list(set(int(i) for i in entrada_ids))
    if not ids:
        return []

    sql = text(_select_entradas_emisor_sql(for_update)).bindparams(
        bindparam("ids", expanding=True)
    )
    result = await db.execute(sql, {"ids": ids, "emisor_id": int(emisor_id)})
    rows = result.all()
    return [
        {
            "entrada_id": int(r.entrada_id),
            "cliente_id": int(r.cliente_id),
            "zona_id": int(r.zona_id),
            "fue_transferida": int(r.fue_transferida) if r.fue_transferida is not None else None,
        }
        for r in rows
    ]


def entradas_ya_transferidas(entradas: Iterable[EntradaRow]) -> List[int]:
    """Por qué: bloquear transferencias repetidas."""
    return [e["entrada_id"] for e in entradas if e.get("fue_transferida") == 1]


async def resumen_por_evento_zona(
    db: AsyncSession, entrada_ids: Iterable[int]
) -> List[Tuple[int, str | None, int, str | None, int]]:
    ids = list(set(int(i) for i in entrada_ids))
    if not ids:
        return []

    sql = text(
        """
        SELECT ev.evento_id,
               ev.nombre       AS evento_nombre,
               z.zona_id,
               z.nombre        AS zona_nombre,
               COUNT(*)        AS cantidad
        FROM Entradas e
        JOIN Zonas z   ON z.zona_id  = e.zona_id
        JOIN Eventos ev ON ev.evento_id = z.evento_id
        WHERE e.entrada_id IN :ids
        GROUP BY ev.evento_id, ev.nombre, z.zona_id, z.nombre
        """
    ).bindparams(bindparam("ids", expanding=True))

    result = await db.execute(sql, {"ids": ids})
    rows = result.all()
    return [(int(r.evento_id), r.evento_nombre, int(r.zona_id), r.zona_nombre, int(r.cantidad)) for r in rows]


async def mover_entradas(db: AsyncSession, entrada_ids: Iterable[int], dest_id: int) -> int:
    ids = list(set(int(i) for i in entrada_ids))
    if not ids:
        return 0

    sql = text(
        """
        UPDATE Entradas
        SET cliente_id = :dest_id,
            fue_transferida = 1
        WHERE entrada_id IN :ids
        """
    ).bindparams(bindparam("ids", expanding=True))

    result = await db.execute(sql, {"dest_id": int(dest_id), "ids": ids})
    return int(result.rowcount or 0)


async def insert_transferencias(
    db: AsyncSession, entrada_ids: Iterable[int], emisor_id: int, dest_id: int
) -> List[int]:
    ids: List[int] = []
    insert_sql = text(
        """
        INSERT INTO Transferencias (entrada_id, cliente_origen_id, cliente_destino_id, fecha_transferencia)
        VALUES (:entrada_id, :emisor_id, :dest_id, NOW())
        """
    )
    for entrada_id in entrada_ids:
        result = await db.execute(
            insert_sql,
            {
                "entrada_id": int(entrada_id),
                "emisor_id": int(emisor_id),
                "dest_id": int(dest_id),
            },
        )
        inserted_id = int(getattr(result, "lastrowid", 0) or 0)
        if inserted_id:
            ids.append(inserted_id)
    return ids
