import asyncio
import os
import sys
from typing import Iterable, List, Sequence

from sqlalchemy import insert, select
from sqlalchemy.exc import SQLAlchemyError

# Asegurar que el paquete app sea importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from app.database.connection import AsyncSessionLocal, engine  # type: ignore  # noqa: E402
from app.models import Cliente, Usuario  # type: ignore  # noqa: E402
from app.utils.security import hash_password  # type: ignore  # noqa: E402

TOTAL_RECORDS = 1000
DEFAULT_PASSWORD = "Ingesoft25"
EMAIL_TEMPLATE = "cliente{index:04d}@example.com"
FIRST_NAMES = [
    "Valeria",
    "Mateo",
    "Camila",
    "Sebastián",
    "Lucía",
    "Diego",
    "Isabella",
    "Sofía",
    "Gabriel",
    "Mariana",
]
LAST_NAMES = [
    "González",
    "Rodríguez",
    "Fernández",
    "Pérez",
    "Torres",
    "Ramírez",
    "Castillo",
    "Rojas",
    "Herrera",
    "Cárdenas",
]
CHUNK_SIZE = 500


def chunked(iterable: Sequence[str], size: int) -> Iterable[Sequence[str]]:
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


def build_usuario_payloads(total: int, hashed_password: str) -> tuple[List[dict], List[str], List[str]]:
    usuarios: List[dict] = []
    emails: List[str] = []
    documentos: List[str] = []

    for i in range(1, total + 1):
        email = EMAIL_TEMPLATE.format(index=i)
        tipo_documento_id = 1 if i % 2 else 2
        if tipo_documento_id == 1:
            numero_documento = f"{10000000 + i:08d}"
        else:
            numero_documento = f"{200000000000 + i:012d}"

        first_name = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
        last_name = LAST_NAMES[(i - 1) % len(LAST_NAMES)]

        usuario_dict = {
            "tipo_documento_id": tipo_documento_id,
            "nombres": first_name,
            "apellidos": last_name,
            "email": email,
            "contrasena": hashed_password,
            "numero_documento": numero_documento,
        }

        usuarios.append(usuario_dict)
        emails.append(email)
        documentos.append(numero_documento)

    return usuarios, emails, documentos


async def get_existing_values(session, column, values: List[str]) -> set[str]:
    existing: set[str] = set()
    if not values:
        return existing

    for value_chunk in chunked(values, CHUNK_SIZE):
        stmt = select(column).where(column.in_(value_chunk))
        result = await session.execute(stmt)
        existing.update(row[0] for row in result.all())

    return existing


async def fetch_inserted_user_ids(session, emails: List[str]) -> List[int]:
    user_ids: List[int] = []
    for email_chunk in chunked(emails, CHUNK_SIZE):
        stmt = select(Usuario.id).where(Usuario.email.in_(email_chunk))
        result = await session.execute(stmt)
        user_ids.extend(row[0] for row in result.all())
    return user_ids


async def seed_usuarios(total_records: int = TOTAL_RECORDS) -> None:
    async with AsyncSessionLocal() as session:
        try:
            hashed_password = await hash_password(DEFAULT_PASSWORD)
            usuarios_payload, emails, documentos = build_usuario_payloads(total_records, hashed_password)

            existing_emails = await get_existing_values(session, Usuario.email, emails)
            existing_docs = await get_existing_values(session, Usuario.numero_documento, documentos)

            usuarios_to_insert = [
                usuario
                for usuario in usuarios_payload
                if usuario["email"] not in existing_emails and usuario["numero_documento"] not in existing_docs
            ]

            if not usuarios_to_insert:
                print("No hay usuarios nuevos para insertar. Todos los registros ya existen.")
                return

            await session.execute(insert(Usuario), usuarios_to_insert)
            await session.flush()

            inserted_emails = [usuario["email"] for usuario in usuarios_to_insert]
            inserted_user_ids = await fetch_inserted_user_ids(session, inserted_emails)

            clientes_to_insert = [
                {
                    "id": user_id,
                    "rango_id": 1,
                    "puntos_disponibles": 0,
                    "puntos_historicos": 0,
                    "recibir_notificaciones": True,
                }
                for user_id in inserted_user_ids
            ]

            await session.execute(insert(Cliente), clientes_to_insert)
            await session.commit()

            total_inserted = len(inserted_user_ids)
            skipped = total_records - total_inserted
            print(f"✅ Usuarios insertados: {total_inserted}")
            if skipped:
                print(f"⚠️  Registros omitidos por duplicado de email o documento: {skipped}")

        except SQLAlchemyError as exc:
            await session.rollback()
            print(f"❌ Error al insertar usuarios: {exc}")
        finally:
            await engine.dispose()


async def main() -> None:
    await seed_usuarios()


if __name__ == "__main__":
    asyncio.run(main())
