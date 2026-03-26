from app.database.connection import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text('SHOW TABLES'))
        tables = result.fetchall()
        print("Tablas existentes:")
        for table in tables:
            print(f"- {table[0]}")
except Exception as e:
    print(f"Error: {e}")