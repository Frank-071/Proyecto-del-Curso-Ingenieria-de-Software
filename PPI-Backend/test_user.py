from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.auth.usuario import Usuario

def test_usuario(db: Session):
    u = Usuario(
    tipo_documento_id=1,
    nombre="Lorena",
    apellido="Pérez",
    genero="F",  
    email="ana@example.com",
    contrasena="MiPass123",
    telefono="999111333",
    modificado_por="test",
    creado_por="test",
    rol=1,
    numero_documento="77766688",
    estado=1
    )
    u.set_password("MiPass123")

    db.add(u)
    db.commit()
    db.refresh(u)
    print("Usuario guardado:", u)


    assert u.verify_password("MiPass123") is True
    print("✅ Contraseña correcta verificada")


    assert u.verify_password("OtraClave") is False
    print("✅ Contraseña incorrecta detectada")

if __name__ == "__main__":

    db = next(get_db())
    test_usuario(db)
    db.close()
