def test_promocion_package_imports():
    from app.models import Promocion
    from app.repositories.promociones import PromocionRepository
    from app.schemas.promociones import PromocionCreateRequest, PromocionResponse
    from app.services.promociones import PromocionService
    from app.routers.promociones import promocion_router

    assert Promocion is not None
    assert PromocionRepository is not None
    assert PromocionCreateRequest is not None
    assert PromocionResponse is not None
    assert PromocionService is not None
    assert promocion_router is not None
