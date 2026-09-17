export type Difficulty = "easy" | "medium" | "hard";

export type Grid = number[][];

export type SupplyMap = Record<number, number>;

export interface GenerateResponse {
  puzzle_id: string;
  difficulty: Difficulty;
  clue_grid: Grid;
  target: number;
  supply: SupplyMap;
}

export interface LineResult {
  index: number;
  sum: number;
  ok: boolean;
}

export interface SubmitResponse {
  correct: boolean;
  elapsed_seconds?: number | null;
  row_results?: LineResult[] | null;
  col_results?: LineResult[] | null;
  box_results?: LineResult[] | null;
  supply_ok?: boolean | null;
}
