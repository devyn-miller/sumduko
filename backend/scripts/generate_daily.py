"""Generate today's daily Sum Sudoku puzzles for each difficulty.

Uses today's ISO date as the generation seed, so every player who requests
the "daily" puzzle for a given difficulty on the same day gets the same
grid (assuming the frontend passes that same date string as `seed` to
POST /api/sumdoku/generate). This script is a smoke test / warm-up: it
exercises the generator end to end and reports timing and clue counts.
Puzzle storage is in-memory in the API process, so this script does not
share state with a running server -- wire it to a persistent store
(Redis/DB) if you want it to actually pre-populate a live server.

Usage: cd backend && python -m scripts.generate_daily [--difficulty easy|medium|hard]
"""

import argparse
import sys
import time
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.games.sumdoku.service import generate_puzzle  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--difficulty",
        choices=["easy", "medium", "hard"],
        help="Only generate this difficulty (default: all three)",
    )
    parser.add_argument(
        "--date",
        default=date.today().isoformat(),
        help="ISO date to use as the daily seed (default: today, UTC)",
    )
    args = parser.parse_args()

    difficulties = [args.difficulty] if args.difficulty else ["easy", "medium", "hard"]

    for difficulty in difficulties:
        seed = f"{args.date}:{difficulty}"
        t0 = time.time()
        record = generate_puzzle(difficulty, seed)
        elapsed = time.time() - t0
        clue_count = sum(1 for row in record.clue_grid for v in row if v != 0)
        print(
            f"{difficulty:>6}  puzzle_id={record.puzzle_id}  target={record.target}  "
            f"clues={clue_count}/81  supply={record.supply}  ({elapsed:.2f}s)"
        )


if __name__ == "__main__":
    main()
