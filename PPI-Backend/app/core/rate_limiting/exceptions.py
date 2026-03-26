from fastapi import HTTPException, status


class RateLimitExceeded(HTTPException):
    def __init__(
        self,
        detail: str = "Demasiados intentos. Por favor intenta más tarde.",
        retry_after: int = 60,
        limit: int = 10,
        window: int = 60
    ):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(retry_after)
            }
        )

