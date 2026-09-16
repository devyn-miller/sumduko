from typing import Dict, List, Optional
from collections import Counter


class Sumdoku:
    def __init__(self, target: int, supply: Dict[int, int]) -> None:
        self.target = target
        self.immutable_supply = Counter(supply)
        self.supply = Counter(supply)

    def generate_sum_sudoku(self) -> Optional[List[List[int]]]:
        if sum(self.immutable_supply.values()) != 81:
            return None
        self.supply = self.immutable_supply.copy()
        grid = [[0] * 9 for _ in range(9)]
        row_sums = [0] * 9
        col_sums = [0] * 9
        box_sums = [0] * 9
        success = self.backtrack(grid, 0, row_sums, col_sums, box_sums)
        return grid if success else None

    def backtrack(self, grid: List[List[int]], pos: int,
                  row_sums: List[int], col_sums: List[int], box_sums: List[int]) -> bool:
        if pos == 81:
            return True
        r, c = divmod(pos, 9)
        box_idx = (r // 3) * 3 + (c // 3)

        for digit in list(self.supply):
            if self.supply[digit] <= 0:
                continue
            grid[r][c] = digit
            self.supply[digit] -= 1
            row_sums[r] += digit
            col_sums[c] += digit
            box_sums[box_idx] += digit

            avail = [d for d in self.supply if self.supply[d] > 0]
            min_avail, max_avail = (min(avail), max(
                avail)) if avail else (None, None)

            cells_left_rows = sum(1 for cc in range(
                9) if cc != c and grid[r][cc] == 0)
            cells_left_cols = sum(1 for rr in range(
                9) if rr != r and grid[rr][c] == 0)
            box_row_start = (r // 3) * 3
            box_col_start = (c // 3) * 3
            cells_left_box = sum(1 for i in range(3) for j in range(3)
                                 if not (box_row_start + i == r and box_col_start + j == c)
                                 and grid[box_row_start + i][box_col_start + j] == 0)
            remaining = ((self.target - row_sums[r], cells_left_rows), (self.target -
                         col_sums[c], cells_left_cols), (self.target - box_sums[box_idx], cells_left_box))

            all_ok = True
            for remain, cells_left in remaining:
                if cells_left > 0:
                    if min_avail is None or remain < cells_left * min_avail or remain > cells_left * max_avail:
                        all_ok = False
                else:
                    if remain != 0:
                        all_ok = False

            if not all_ok:
                grid[r][c] = 0
                self.supply[digit] += 1
                row_sums[r] -= digit
                col_sums[c] -= digit
                box_sums[box_idx] -= digit
                continue

            if self.backtrack(grid, pos + 1, row_sums, col_sums, box_sums):
                return True
            grid[r][c] = 0
            self.supply[digit] += 1
            row_sums[r] -= digit
            col_sums[c] -= digit
            box_sums[box_idx] -= digit

        return False

    def count_backtrack(self, grid: List[List[int]], pos: int,
                        row_sums: List[int], col_sums: List[int], box_sums: List[int], backtrack_count: int, cap: int) -> int:
        if pos == 81:
            return backtrack_count + 1
        r, c = divmod(pos, 9)
        if grid[r][c] != 0:
            return self.count_backtrack(grid, pos + 1, row_sums, col_sums, box_sums, backtrack_count, cap)

        box_idx = (r // 3) * 3 + (c // 3)

        for digit in list(self.supply):
            if self.supply[digit] <= 0:
                continue
            grid[r][c] = digit
            self.supply[digit] -= 1
            row_sums[r] += digit
            col_sums[c] += digit
            box_sums[box_idx] += digit

            avail = [d for d in self.supply if self.supply[d] > 0]
            min_avail, max_avail = (min(avail), max(
                avail)) if avail else (None, None)

            cells_left_rows = sum(1 for cc in range(
                9) if cc != c and grid[r][cc] == 0)
            cells_left_cols = sum(1 for rr in range(
                9) if rr != r and grid[rr][c] == 0)
            box_row_start = (r // 3) * 3
            box_col_start = (c // 3) * 3
            cells_left_box = sum(1 for i in range(3) for j in range(3)
                                 if not (box_row_start + i == r and box_col_start + j == c)
                                 and grid[box_row_start + i][box_col_start + j] == 0)
            remaining = ((self.target - row_sums[r], cells_left_rows), (self.target -
                         col_sums[c], cells_left_cols), (self.target - box_sums[box_idx], cells_left_box))

            all_ok = True
            for remain, cells_left in remaining:
                if cells_left > 0:
                    if min_avail is None or remain < cells_left * min_avail or remain > cells_left * max_avail:
                        all_ok = False
                else:
                    if remain != 0:
                        all_ok = False

            if not all_ok:
                grid[r][c] = 0
                self.supply[digit] += 1
                row_sums[r] -= digit
                col_sums[c] -= digit
                box_sums[box_idx] -= digit
                continue

            backtrack_count = self.count_backtrack(
                grid, pos + 1, row_sums, col_sums, box_sums, backtrack_count, cap)
            if backtrack_count >= cap:
                grid[r][c] = 0
                self.supply[digit] += 1
                row_sums[r] -= digit
                col_sums[c] -= digit
                box_sums[box_idx] -= digit
                return backtrack_count

            grid[r][c] = 0
            self.supply[digit] += 1
            row_sums[r] -= digit
            col_sums[c] -= digit
            box_sums[box_idx] -= digit

        return backtrack_count

    def count_solutions(self, grid: List[List[int]], cap: int = 2) -> int:
        clue_counts = Counter()
        for row in grid:
            for digit in row:
                if digit != 0:
                    clue_counts[digit] += 1
        self.supply = self.immutable_supply - clue_counts
        row_sums = [0] * 9
        col_sums = [0] * 9
        box_sums = [0] * 9
        for r in range(9):
            for c in range(9):
                row_sums[r] += grid[r][c]
                col_sums[c] += grid[r][c]
                box_idx = (r // 3) * 3 + (c // 3)
                box_sums[box_idx] += grid[r][c]
        backtrack_count = self.count_backtrack(
            grid, 0, row_sums, col_sums, box_sums, 0, cap)
        return backtrack_count
