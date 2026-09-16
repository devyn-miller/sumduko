from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.games.sumdoku.router import router as sumdoku_router

app = FastAPI(title="Puzzle Games API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sumdoku_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
