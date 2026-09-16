import random
from collections import Counter
from typing import List, Tuple

from app.games.sumdoku.difficulty import (
    COUNT_SOLUTIONS_CAP,
    DIFFICULTY_CONFIGS,
    MAX_GENERATION_ATTEMPTS,
    STRIP_MAX_ATTEMPTS,
    SUPPLY_POOL,
    SupplyPreset,
)
from app.games.sumdoku.generator import Sumdoku
from app.games.sumdoku.models import Difficulty, Grid, LineResult, SubmitResponse
from app.storage.puzzles import PuzzleRecord, puzzle_store


def _count_clues(grid: Grid) -> int:
    return sum(1 for row in grid for value in row if value != 0)


def generate_puzzle(difficulty: Difficulty, seed: str | None = None) -> PuzzleRecord:
    """Generate (or retry-generate) a puzzle for the given difficulty.

    Picks a target/supply preset, builds a solved grid, and strips it down
    toward the difficulty's clue-count range. Some presets can't reach a
    given range within STRIP_MAX_ATTEMPTS (their "natural floor" of
    strippable clues is too high), so this retries with a freshly derived
    seed -- and potentially a different preset -- up to
    MAX_GENERATION_ATTEMPTS times, falling back to the closest attempt seen.
    """
    cfg = DIFFICULTY_CONFIGS[difficulty]
    lo, hi = cfg.clue_range

    picker = random.Random(seed) if seed is not None else random.Random()

    best: Tuple[SupplyPreset, List[List[int]], List[List[int]], int, int] | None = None

    for _ in range(MAX_GENERATION_ATTEMPTS):
        preset = picker.choice(SUPPLY_POOL)
        random.seed(picker.random())

        sumdoku = Sumdoku(preset.target, dict(preset.supply))
        solved = sumdoku.generate_sum_sudoku()
        if not solved:
            continue

        clue_grid = sumdoku.strip_to_unique(
            solved,
            max_attempts=STRIP_MAX_ATTEMPTS,
            min_clues=cfg.min_clues,
            cap=COUNT_SOLUTIONS_CAP,
        )
        clue_count = _count_clues(clue_grid)

        if lo <= clue_count <= hi:
            return puzzle_store.create(
                difficulty=difficulty,
                target=preset.target,
                supply=preset.supply,
                solution=solved,
                clue_grid=clue_grid,
            )

        distance = lo - clue_count if clue_count < lo else clue_count - hi
        if best is None or distance < best[4]:
            best = (preset, solved, clue_grid, clue_count, distance)

    assert best is not None, "no preset in SUPPLY_POOL produced a valid solved grid"
    preset, solved, clue_grid, _clue_count, _distance = best
    return puzzle_store.create(
        difficulty=difficulty,
        target=preset.target,
        supply=preset.supply,
        solution=solved,
        clue_grid=clue_grid,
    )


def _line_results(sums: List[int], target: int) -> List[LineResult]:
    return [LineResult(index=i, sum=s, ok=(s == target)) for i, s in enumerate(sums)]


def validate_submission(record: PuzzleRecord, filled_grid: Grid) -> SubmitResponse:
    target = record.target

    # Clues must not have been altered by the client.
    for r in range(9):
        for c in range(9):
            clue = record.clue_grid[r][c]
            if clue != 0 and filled_grid[r][c] != clue:
                return SubmitResponse(correct=False)

    complete = all(filled_grid[r][c] != 0 for r in range(9) for c in range(9))

    row_sums = [sum(filled_grid[r][c] for c in range(9)) for r in range(9)]
    col_sums = [sum(filled_grid[r][c] for r in range(9)) for c in range(9)]
    box_sums = [0] * 9
    for r in range(9):
        for c in range(9):
            box_sums[(r // 3) * 3 + (c // 3)] += filled_grid[r][c]

    row_results = _line_results(row_sums, target)
    col_results = _line_results(col_sums, target)
    box_results = _line_results(box_sums, target)

    used = Counter(value for row in filled_grid for value in row if value != 0)
    supply_ok = complete and all(
        used.get(digit, 0) == count for digit, count in record.supply.items()
    )

    sums_ok = all(r.ok for r in row_results) and all(c.ok for c in col_results) and all(
        b.ok for b in box_results
    )

    correct = complete and sums_ok and supply_ok

    return SubmitResponse(
        correct=correct,
        row_results=row_results,
        col_results=col_results,
        box_results=box_results,
        supply_ok=supply_ok,
    )
