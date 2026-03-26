# app/routers/eventos/historial_transferencia.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database.connection import get_db
from app.core.auth.dependencies import get_current_cliente_id

router = APIRouter(prefix="/transferencias", tags=["historial-transferencias"])

@router.get("/historial/{cliente_id}")
async def get_historial_transferencias(
    cliente_id: int,
    current_cliente_id: int = Depends(get_current_cliente_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene el historial de transferencias donde el cliente es origen o destino.
    Solo permite ver el historial propio.
    """
    # Verificar que solo pueda ver su propio historial
    if cliente_id != current_cliente_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este historial")
    
    try:
        # Consulta para obtener transferencias con información de eventos y clientes
        sql = text("""
            SELECT DISTINCT
                t.transferencia_id,
                t.fecha_transferencia,
                t.cliente_origen_id,
                t.cliente_destino_id,
                ev.evento_id,
                ev.nombre as evento_nombre,
                u_origen.numero_documento as dni_origen,
                u_destino.numero_documento as dni_destino
            FROM Transferencias t
            JOIN Entradas e ON e.entrada_id = t.entrada_id
            JOIN Zonas z ON z.zona_id = e.zona_id
            JOIN Eventos ev ON ev.evento_id = z.evento_id
            JOIN Clientes c_origen ON c_origen.cliente_id = t.cliente_origen_id
            JOIN Usuarios u_origen ON u_origen.usuario_id = c_origen.cliente_id
            JOIN Clientes c_destino ON c_destino.cliente_id = t.cliente_destino_id
            JOIN Usuarios u_destino ON u_destino.usuario_id = c_destino.cliente_id
            WHERE t.cliente_origen_id = :cliente_id OR t.cliente_destino_id = :cliente_id
            GROUP BY t.transferencia_id, ev.evento_id
            ORDER BY t.fecha_transferencia DESC
        """)
        
        result = await db.execute(sql, {"cliente_id": cliente_id})
        rows = result.all()
        
        # Formatear el resultado según los requerimientos
        historial = []
        for row in rows:
            # Determinar si es enviada o recibida
            tipo = "enviada" if row.cliente_origen_id == cliente_id else "recibida"
            
            # Crear descripción según el tipo
            if tipo == "enviada":
                descripcion = f"Transferido a cliente con DNI: {row.dni_destino}"
            else:
                descripcion = f"Recibido de cliente con DNI: {row.dni_origen}"
            
            historial.append({
                "id": row.transferencia_id,
                "fecha_transferencia": str(row.fecha_transferencia) if row.fecha_transferencia else None,
                "tipo": tipo,
                "evento": {
                    "id": row.evento_id,
                    "nombre": row.evento_nombre
                },
                "descripcion": descripcion
            })
        
        return {"historial": historial}
        
    except Exception as e:
        import traceback
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        print(f"Error completo: {error_details}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")