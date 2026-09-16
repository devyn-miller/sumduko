import type { Grid } from "./types";

export type LineStatus = "empty" | "progress" | "match" | "over";

export interface LineState {
  index: number;
  sum: number;
  status: LineStatus;
}

function statusFor(sum: number, target: number): LineStatus {
  if (sum === 0) return "empty";
  if (sum === target) return "match";
  if (sum > target) return "over";
  return "progress";
}

export interface LineStates {
  rows: LineState[];
  cols: LineState[];
  boxes: LineState[];
}

export function computeLineStates(grid: Grid, target: number): LineStates {
  const rows: LineState[] = [];
  const cols: LineState[] = [];
  const boxes: LineState[] = new Array(9)
    .fill(0)
    .map((_, index) => ({ index, sum: 0, status: "empty" as LineStatus }));
  const boxSums = new Array(9).fill(0);

  for (let r = 0; r < 9; r++) {
    let rowSum = 0;
    for (let c = 0; c < 9; c++) {
      rowSum += grid[r][c];
      boxSums[Math.floor(r / 3) * 3 + Math.floor(c / 3)] += grid[r][c];
    }
    rows.push({ index: r, sum: rowSum, status: statusFor(rowSum, target) });
  }

  for (let c = 0; c < 9; c++) {
    let colSum = 0;
    for (let r = 0; r < 9; r++) {
      colSum += grid[r][c];
    }
    cols.push({ index: c, sum: colSum, status: statusFor(colSum, target) });
  }

  for (let b = 0; b < 9; b++) {
    boxes[b] = { index: b, sum: boxSums[b], status: statusFor(boxSums[b], target) };
  }

  return { rows, cols, boxes };
}

export function boxIndexForCell(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}
