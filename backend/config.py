import os

SECRET_KEY = os.environ.get("SECRET_KEY", "your-local-fallback-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30