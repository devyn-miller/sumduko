"""In-memory puzzle storage, keyed by puzzle_id.

Solutions are never sent to the client, only kept here for /submit to check
against. Swap this module for a Redis/DB-backed store later without
changing callers -- they only use create()/get().
"""

import time
import uuid
from dataclasses import dataclass, field
from threading import Lock
from typing import Dict, List, Optional


@dataclass
class PuzzleRecord:
    puzzle_id: str
    difficulty: str
    target: int
    supply: Dict[int, int]
    solution: List[List[int]]
    clue_grid: List[List[int]]
    created_at: float = field(default_factory=time.time)


class PuzzleStore:
    def __init__(self) -> None:
        self._puzzles: Dict[str, PuzzleRecord] = {}
        self._lock = Lock()

    def create(
        self,
        difficulty: str,
        target: int,
        supply: Dict[int, int],
        solution: List[List[int]],
        clue_grid: List[List[int]],
    ) -> PuzzleRecord:
        puzzle_id = uuid.uuid4().hex
        record = PuzzleRecord(
            puzzle_id=puzzle_id,
            difficulty=difficulty,
            target=target,
            supply=dict(supply),
            solution=[row[:] for row in solution],
            clue_grid=[row[:] for row in clue_grid],
        )
        with self._lock:
            self._puzzles[puzzle_id] = record
        return record

    def get(self, puzzle_id: str) -> Optional[PuzzleRecord]:
        with self._lock:
            return self._puzzles.get(puzzle_id)


puzzle_store = PuzzleStore()
