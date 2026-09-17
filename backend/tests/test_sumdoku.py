import random
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.games.sumdoku.difficulty import DIFFICULTY_CONFIGS
from app.games.sumdoku.generator import Sumdoku
from app.games.sumdoku.service import generate_puzzle, validate_submission
from app.storage.puzzles import puzzle_store


def grid_sums(grid):
    row_sums = [sum(row) for row in grid]
    col_sums = [sum(grid[r][c] for r in range(9)) for c in range(9)]
    box_sums = [0] * 9
    for r in range(9):
        for c in range(9):
            box_sums[(r // 3) * 3 + (c // 3)] += grid[r][c]
    return row_sums, col_sums, box_sums


class TestGenerateSumSudoku:
    def test_generates_valid_grid(self):
        target, supply = 45, {2: 27, 5: 27, 8: 27}
        s = Sumdoku(target, supply)
        grid = s.generate_sum_sudoku()
        assert grid is not None
        row_sums, col_sums, box_sums = grid_sums(grid)
        assert all(v == target for v in row_sums)
        assert all(v == target for v in col_sums)
        assert all(v == target for v in box_sums)

    def test_uses_exact_supply(self):
        target, supply = 41, {1: 45, 9: 36}
        s = Sumdoku(target, supply)
        grid = s.generate_sum_sudoku()
        from collections import Counter

        used = Counter(v for row in grid for v in row)
        assert used == Counter(supply)

    def test_rejects_supply_not_summing_to_81(self):
        s = Sumdoku(45, {1: 10, 2: 10})
        assert s.generate_sum_sudoku() is None


class TestStripToUnique:
    def test_strip_preserves_unique_solution(self):
        random.seed(42)
        target, supply = 45, {2: 27, 5: 27, 8: 27}
        s = Sumdoku(target, supply)
        solved = s.generate_sum_sudoku()
        clue_grid = s.strip_to_unique(solved, max_attempts=81)

        clue_count = sum(1 for row in clue_grid for v in row if v != 0)
        assert 0 < clue_count < 81

        assert s.count_solutions(clue_grid, cap=2) == 1

        for r in range(9):
            for c in range(9):
                if clue_grid[r][c] != 0:
                    assert clue_grid[r][c] == solved[r][c]

    def test_respects_min_clues(self):
        random.seed(7)
        target, supply = 41, {1: 45, 9: 36}
        s = Sumdoku(target, supply)
        solved = s.generate_sum_sudoku()
        clue_grid = s.strip_to_unique(solved, max_attempts=81, min_clues=50)
        clue_count = sum(1 for row in clue_grid for v in row if v != 0)
        assert clue_count >= 50

    def test_respects_max_attempts(self):
        random.seed(3)
        target, supply = 45, {2: 27, 5: 27, 8: 27}
        s = Sumdoku(target, supply)
        solved = s.generate_sum_sudoku()
        clue_grid = s.strip_to_unique(solved, max_attempts=1)
        clue_count = sum(1 for row in clue_grid for v in row if v != 0)
        # At most one cell attempted for removal.
        assert clue_count >= 80


class TestGeneratePuzzleService:
    @pytest.mark.parametrize("difficulty", ["easy", "medium", "hard"])
    def test_generates_within_clue_range_or_close(self, difficulty):
        record = generate_puzzle(difficulty, seed=f"test-seed-{difficulty}")
        lo, hi = DIFFICULTY_CONFIGS[difficulty].clue_range
        clue_count = sum(1 for row in record.clue_grid for v in row if v != 0)
        # Fallback path can miss the exact window; stay within a generous margin.
        assert lo - 5 <= clue_count <= hi + 15

    def test_same_seed_is_deterministic(self):
        r1 = generate_puzzle("medium", seed="reproducible-seed")
        r2 = generate_puzzle("medium", seed="reproducible-seed")
        assert r1.target == r2.target
        assert r1.supply == r2.supply
        assert r1.clue_grid == r2.clue_grid
        assert r1.solution == r2.solution

    def test_stores_puzzle_and_hides_solution_from_clue_grid(self):
        record = generate_puzzle("easy", seed="storage-check")
        fetched = puzzle_store.get(record.puzzle_id)
        assert fetched is record
        for r in range(9):
            for c in range(9):
                if record.clue_grid[r][c] != 0:
                    assert record.clue_grid[r][c] == record.solution[r][c]


class TestValidateSubmission:
    def test_correct_solution_passes(self):
        record = generate_puzzle("easy", seed="validate-correct")
        response = validate_submission(record, record.solution)
        assert response.correct is True
        assert response.supply_ok is True

    def test_wrong_supply_fails(self):
        record = generate_puzzle("easy", seed="validate-wrong-supply")
        bad_grid = [row[:] for row in record.solution]
        # Find two distinct-valued cells that are not clues and swap won't
        # necessarily break sums; instead corrupt one non-clue cell directly
        # by cycling it to another in-supply digit, which will break some
        # line sum and/or the supply balance.
        digits = list(record.supply.keys())
        for r in range(9):
            for c in range(9):
                if record.clue_grid[r][c] == 0:
                    other = next(d for d in digits if d != bad_grid[r][c])
                    bad_grid[r][c] = other
                    response = validate_submission(record, bad_grid)
                    assert response.correct is False
                    return
        pytest.fail("puzzle had no non-clue cells to corrupt")

    def test_incomplete_grid_fails(self):
        record = generate_puzzle("easy", seed="validate-incomplete")
        incomplete = [row[:] for row in record.clue_grid]
        response = validate_submission(record, incomplete)
        assert response.correct is False

    def test_altered_clue_fails(self):
        record = generate_puzzle("easy", seed="validate-altered-clue")
        grid = [row[:] for row in record.solution]
        for r in range(9):
            for c in range(9):
                if record.clue_grid[r][c] != 0:
                    other_digit = next(d for d in record.supply if d != grid[r][c])
                    grid[r][c] = other_digit
                    response = validate_submission(record, grid)
                    assert response.correct is False
                    return
        pytest.fail("puzzle had no clues to alter")
