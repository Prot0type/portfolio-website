from __future__ import annotations

import json
import time
from functools import lru_cache
from typing import Dict, Optional
from urllib.request import urlopen

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwk, jwt
from jose.exceptions import JWTError
from jose.utils import base64url_decode

from app.config import Settings, get_settings

security = HTTPBearer(auto_error=False)


class CognitoVerifier:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._issuer = (
            f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}"
        )

    @property
    def enabled(self) -> bool:
        return (
            not self._settings.disable_auth
            and bool(self._settings.cognito_user_pool_id)
            and bool(self._settings.cognito_app_client_id)
        )

    @lru_cache(maxsize=1)
    def _jwks(self) -> Dict:
        url = f"{self._issuer}/.well-known/jwks.json"
        with urlopen(url, timeout=5) as response:
            return json.loads(response.read())

    def verify(self, token: str) -> Dict:
        try:
            header = jwt.get_unverified_header(token)
            claims = jwt.get_unverified_claims(token)
        except JWTError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

        kid = header.get("kid")
        key_data = next((key for key in self._jwks()["keys"] if key["kid"] == kid), None)
        if key_data is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown key id")

        key = jwk.construct(key_data)
        message, encoded_sig = token.rsplit(".", 1)
        if not key.verify(message.encode("utf-8"), base64url_decode(encoded_sig.encode("utf-8"))):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token signature invalid")

        issuer = claims.get("iss")
        if issuer != self._issuer:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token issuer invalid")

        token_use = claims.get("token_use")
        if token_use not in {"id", "access"}:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token type invalid")

        exp = int(claims.get("exp", 0))
        if exp and exp < int(time.time()):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

        if token_use == "id":
            aud = claims.get("aud")
            if aud != self._settings.cognito_app_client_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Token audience invalid"
                )
        else:
            client_id = claims.get("client_id")
            if client_id != self._settings.cognito_app_client_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Token client_id invalid"
                )

        return claims


def _auth_error(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)


def get_verifier(settings: Settings = Depends(get_settings)) -> CognitoVerifier:
    return CognitoVerifier(settings=settings)


def optional_claims(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    verifier: CognitoVerifier = Depends(get_verifier),
) -> Optional[Dict]:
    if not verifier.enabled:
        return {"sub": "local-user", "email": "local@example.com"}
    if not credentials:
        return None
    return verifier.verify(credentials.credentials)


def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    verifier: CognitoVerifier = Depends(get_verifier),
) -> Dict:
    if not verifier.enabled:
        return {"sub": "local-admin", "email": "local@example.com"}
    if not credentials:
        raise _auth_error("Missing bearer token")
    return verifier.verify(credentials.credentials)
