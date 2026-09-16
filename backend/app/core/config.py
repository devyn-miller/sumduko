import os


class Settings:
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.environ.get(
            "SUMDUKO_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
