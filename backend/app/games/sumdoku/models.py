from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

Difficulty = Literal["easy", "medium", "hard"]
Grid = List[List[int]]


def _validate_grid_shape(grid: Grid) -> Grid:
    if len(grid) != 9 or any(len(row) != 9 for row in grid):
        raise ValueError("grid must be 9x9")
    for row in grid:
        for value in row:
            if not isinstance(value, int) or value < 0 or value > 9:
                raise ValueError("grid values must be integers between 0 and 9")
    return grid


class GenerateRequest(BaseModel):
    difficulty: Difficulty = "medium"
    seed: Optional[str] = None


class GenerateResponse(BaseModel):
    puzzle_id: str
    difficulty: Difficulty
    clue_grid: Grid
    target: int
    supply: Dict[int, int]


class SubmitRequest(BaseModel):
    puzzle_id: str
    filled_grid: Grid = Field(...)

    @field_validator("filled_grid")
    @classmethod
    def validate_filled_grid(cls, value: Grid) -> Grid:
        return _validate_grid_shape(value)


class LineResult(BaseModel):
    index: int
    sum: int
    ok: bool


class SubmitResponse(BaseModel):
    correct: bool
    elapsed_seconds: Optional[float] = None
    row_results: Optional[List[LineResult]] = None
    col_results: Optional[List[LineResult]] = None
    box_results: Optional[List[LineResult]] = None
    supply_ok: Optional[bool] = None
