import logging
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import configure_exception_handlers
from app.core.routing import get_all_routers
from app.utils.health_checks import check_database, check_redis, check_s3

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(name)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Content-Type", 
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
)

# Configurar manejo global de excepciones
configure_exception_handlers(app)

for router in get_all_routers():
    app.include_router(router)

@app.get("/")
async def read_root():
    return {"message": "PPI Backend API", "version": settings.APP_VERSION}

@app.get("/health")
async def health_check():
    db_check = await check_database()
    redis_check = await check_redis()
    s3_check = await check_s3()
    
    overall_status = "healthy" if all(
        check["status"] == "healthy" 
        for check in [db_check, redis_check, s3_check]
    ) else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.APP_VERSION,
        "checks": {
            "database": db_check,
            "redis": redis_check,
            "s3": s3_check
        }
    }

@app.get("/health/liveness")
async def liveness():
    return {"status": "alive"}

@app.get("/health/readiness")
async def readiness():
    db_check = await check_database()
    redis_check = await check_redis()
    
    is_ready = db_check["status"] == "healthy" and redis_check["status"] == "healthy"
    
    if is_ready:
        return {"status": "ready", "database": db_check, "redis": redis_check}
    else:
        raise HTTPException(status_code=503, detail={
            "status": "not_ready",
            "database": db_check,
            "redis": redis_check
        })