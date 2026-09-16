"""Target/supply presets and clue-count tuning for each difficulty tier.

Values here were picked empirically (see dev notes in the PR/commit history):
Sumdoku.generate_sum_sudoku() is deterministic for a given (target, supply)
pair, and Sumdoku.strip_to_unique() can only remove clues down to a
"natural floor" that depends on how constrained that pair is. A pool of
presets is kept (rather than one-per-difficulty) so the generator in
service.py can retry with a different preset when the one it picked can't
reach the requested clue-count range within max_attempts.
"""

from typing import Dict, List, NamedTuple, Tuple


class SupplyPreset(NamedTuple):
    target: int
    supply: Dict[int, int]


# Every preset here sums to 81 cells and has a weighted digit sum divisible
# by 9 (so target = weighted_sum / 9 lands on rows/cols/boxes evenly).
SUPPLY_POOL: List[SupplyPreset] = [
    SupplyPreset(41, {1: 45, 9: 36}),
    SupplyPreset(45, {2: 27, 5: 27, 8: 27}),
    SupplyPreset(45, {1: 27, 5: 27, 9: 27}),
    SupplyPreset(25, {1: 63, 9: 18}),
    SupplyPreset(57, {1: 27, 9: 54}),
    SupplyPreset(65, {1: 18, 9: 63}),
]


class DifficultyConfig(NamedTuple):
    clue_range: Tuple[int, int]
    min_clues: int


DIFFICULTY_CONFIGS: Dict[str, DifficultyConfig] = {
    "easy": DifficultyConfig(clue_range=(40, 50), min_clues=42),
    "medium": DifficultyConfig(clue_range=(28, 37), min_clues=30),
    "hard": DifficultyConfig(clue_range=(18, 27), min_clues=20),
}

MAX_GENERATION_ATTEMPTS = 8
STRIP_MAX_ATTEMPTS = 81
COUNT_SOLUTIONS_CAP = 2
