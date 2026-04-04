from fastapi import Header, HTTPException, status

from core.settings import settings


async def verify_internal_shared_secret(
    x_internal_secret: str | None = Header(default=None),
):
    if x_internal_secret != settings.internal_shared_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal secret",
        )
