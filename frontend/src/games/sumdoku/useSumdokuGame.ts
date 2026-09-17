import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateSumdokuPuzzle, submitSumdokuSolution } from "../../api/client";
import { computeLineStates } from "./lines";
import type { Difficulty, Grid, SubmitResponse, SupplyMap } from "./types";

export type GameStatus = "loading" | "playing" | "checking" | "won" | "error";

interface CellPos {
  row: number;
  col: number;
}

function emptyGrid(): Grid {
  return Array.from({ length: 9 }, () => new Array(9).fill(0));
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function countDigits(grid: Grid): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const row of grid) {
    for (const value of row) {
      if (value !== 0) counts[value] = (counts[value] ?? 0) + 1;
    }
  }
  return counts;
}

export function useSumdokuGame(initialDifficulty: Difficulty = "medium") {
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [clueGrid, setClueGrid] = useState<Grid>(emptyGrid);
  const [playerGrid, setPlayerGrid] = useState<Grid>(emptyGrid);
  const [target, setTarget] = useState(0);
  const [supply, setSupply] = useState<SupplyMap>({});
  const [selected, setSelected] = useState<CellPos | null>(null);
  const [status, setStatus] = useState<GameStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [lastResult, setLastResult] = useState<SubmitResponse | null>(null);

  const submittedRef = useRef(false);

  const loadPuzzle = useCallback(async (diff: Difficulty, seed?: string) => {
    setStatus("loading");
    setErrorMessage(null);
    setSelected(null);
    setStartedAt(null);
    setFinishedAt(null);
    setLastResult(null);
    submittedRef.current = false;
    try {
      const puzzle = await generateSumdokuPuzzle(diff, seed);
      setPuzzleId(puzzle.puzzle_id);
      setClueGrid(puzzle.clue_grid);
      setPlayerGrid(cloneGrid(puzzle.clue_grid));
      setTarget(puzzle.target);
      setSupply(puzzle.supply);
      setDifficulty(puzzle.difficulty);
      setStatus("playing");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load puzzle");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadPuzzle(initialDifficulty);
    // Only run on mount; explicit newGame() calls handle later changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "playing" || startedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status, startedAt]);

  const isClue = useCallback(
    (row: number, col: number) => clueGrid[row][col] !== 0,
    [clueGrid],
  );

  const remainingSupply = useMemo<SupplyMap>(() => {
    const used = countDigits(playerGrid);
    const remaining: SupplyMap = {};
    for (const digit of Object.keys(supply).map(Number)) {
      remaining[digit] = supply[digit] - (used[digit] ?? 0);
    }
    return remaining;
  }, [playerGrid, supply]);

  const lineStates = useMemo(() => computeLineStates(playerGrid, target), [playerGrid, target]);

  const isFull = useMemo(
    () => playerGrid.every((row) => row.every((value) => value !== 0)),
    [playerGrid],
  );

  const checkSolution = useCallback(async () => {
    if (!puzzleId) return;
    setStatus("checking");
    try {
      const result = await submitSumdokuSolution(puzzleId, playerGrid);
      setLastResult(result);
      if (result.correct) {
        setFinishedAt(Date.now());
        setStatus("won");
      } else {
        setStatus("playing");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to check solution");
      setStatus("playing");
    }
  }, [puzzleId, playerGrid]);

  useEffect(() => {
    if (isFull && status === "playing" && !submittedRef.current) {
      submittedRef.current = true;
      void checkSolution();
    }
    if (!isFull) {
      submittedRef.current = false;
    }
  }, [isFull, status, checkSolution]);

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (isClue(row, col)) return;
      setSelected({ row, col });
    },
    [isClue],
  );

  const placeDigit = useCallback(
    (digit: number) => {
      if (!selected || status !== "playing") return;
      const { row, col } = selected;
      if (isClue(row, col)) return;

      setPlayerGrid((prev) => {
        const current = prev[row][col];
        if (current === digit) return prev; // no-op; use clearCell to remove
        const next = cloneGrid(prev);
        next[row][col] = digit;
        return next;
      });
      setStartedAt((prev) => prev ?? Date.now());
    },
    [selected, status, isClue],
  );

  const clearSelectedCell = useCallback(() => {
    if (!selected || status !== "playing") return;
    const { row, col } = selected;
    if (isClue(row, col)) return;
    setPlayerGrid((prev) => {
      if (prev[row][col] === 0) return prev;
      const next = cloneGrid(prev);
      next[row][col] = 0;
      return next;
    });
  }, [selected, status, isClue]);

  const newGame = useCallback(
    (diff: Difficulty, seed?: string) => {
      void loadPuzzle(diff, seed);
    },
    [loadPuzzle],
  );

  const elapsedSeconds = useMemo(() => {
    if (startedAt === null) return 0;
    const end = finishedAt ?? now;
    return Math.max(0, Math.floor((end - startedAt) / 1000));
  }, [startedAt, finishedAt, now]);

  return {
    difficulty,
    puzzleId,
    target,
    supply,
    playerGrid,
    clueGrid,
    selected,
    status,
    errorMessage,
    lastResult,
    remainingSupply,
    lineStates,
    isClue,
    isFull,
    elapsedSeconds,
    selectCell,
    placeDigit,
    clearSelectedCell,
    checkSolution,
    newGame,
  };
}

export type SumdokuGameApi = ReturnType<typeof useSumdokuGame>;
