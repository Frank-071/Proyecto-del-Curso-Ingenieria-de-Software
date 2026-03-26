def test_promocion_model_fields_exist():
    from app.models import Promocion

    # Check some core attributes/columns exist on the SQLAlchemy model class
    assert hasattr(Promocion, 'id')
    assert hasattr(Promocion, 'evento_id')
    assert hasattr(Promocion, 'nombre')
    assert hasattr(Promocion, 'porcentaje_promocion')
    assert hasattr(Promocion, 'fecha_inicio')
    assert hasattr(Promocion, 'fecha_fin')
    assert hasattr(Promocion, 'activo')
