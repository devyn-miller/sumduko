import type {
  Difficulty,
  GenerateResponse,
  Grid,
  SubmitResponse,
  SupplyMap,
} from "../games/sumdoku/types";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Request to ${path} failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as T;
}

function normalizeSupply(raw: Record<string, number>): SupplyMap {
  const supply: SupplyMap = {};
  for (const [digit, count] of Object.entries(raw)) {
    supply[Number(digit)] = count;
  }
  return supply;
}

export async function generateSumdokuPuzzle(
  difficulty: Difficulty,
  seed?: string,
): Promise<GenerateResponse> {
  const raw = await postJson<GenerateResponse>("/api/sumdoku/generate", {
    difficulty,
    seed,
  });
  return { ...raw, supply: normalizeSupply(raw.supply as unknown as Record<string, number>) };
}

export async function submitSumdokuSolution(
  puzzleId: string,
  filledGrid: Grid,
): Promise<SubmitResponse> {
  return postJson<SubmitResponse>("/api/sumdoku/submit", {
    puzzle_id: puzzleId,
    filled_grid: filledGrid,
  });
}
