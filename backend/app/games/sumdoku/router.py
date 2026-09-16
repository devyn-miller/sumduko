from fastapi import APIRouter, HTTPException

from app.games.sumdoku.models import GenerateRequest, GenerateResponse, SubmitRequest, SubmitResponse
from app.games.sumdoku.service import generate_puzzle, validate_submission
from app.storage.puzzles import puzzle_store

router = APIRouter(prefix="/api/sumdoku", tags=["sumdoku"])


@router.post("/generate", response_model=GenerateResponse)
def generate(payload: GenerateRequest) -> GenerateResponse:
    record = generate_puzzle(payload.difficulty, payload.seed)
    return GenerateResponse(
        puzzle_id=record.puzzle_id,
        difficulty=record.difficulty,
        clue_grid=record.clue_grid,
        target=record.target,
        supply=record.supply,
    )


@router.post("/submit", response_model=SubmitResponse)
def submit(payload: SubmitRequest) -> SubmitResponse:
    record = puzzle_store.get(payload.puzzle_id)
    if record is None:
        raise HTTPException(status_code=404, detail="puzzle not found")
    return validate_submission(record, payload.filled_grid)
