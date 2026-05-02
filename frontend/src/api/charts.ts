import { apiFetch } from './client';
import type { ChartsRow, ChartsSnapshot } from './types';

// Bosun's `/api/charts` returns `{ ok: true, charts: CrewChartRow[] }` where
// each row uses backend column names (`points`, `last_solve_at`). The
// frontend's `ChartsSnapshot` shape adds `frozen` + `generated_at` and uses
// `score` instead of `points`. We normalise here so consumers (LiveCharts,
// ClosingCeremony, Landing) can rely on a single shape regardless of which
// transport (REST or WS) delivered the data.

interface BackendChartRow {
  crew_id: string;
  crew_name: string;
  flag_emoji: string | null;
  points: number;
  solves: number;
  last_solve_at: string | null;
}

interface BackendChartsResponse {
  ok: boolean;
  charts: BackendChartRow[];
  // Optional fields that newer Bosun builds may include — accept them if
  // present, fall back to safe defaults if not.
  frozen?: boolean;
  generated_at?: string;
}

function toSnapshot(res: BackendChartsResponse): ChartsSnapshot {
  const rows: ChartsRow[] = (res.charts ?? []).map((r, idx) => ({
    rank: idx + 1,
    crew_id: r.crew_id,
    crew_name: r.crew_name,
    flag_emoji: r.flag_emoji,
    score: r.points,
    last_solve_at: r.last_solve_at,
    solves: r.solves,
  }));
  return {
    rows,
    frozen: Boolean(res.frozen),
    generated_at: res.generated_at ?? new Date().toISOString(),
  };
}

export const chartsApi = {
  async snapshot(): Promise<ChartsSnapshot> {
    const res = await apiFetch<BackendChartsResponse>('/api/charts');
    return toSnapshot(res);
  },

  async me(): Promise<ChartsSnapshot> {
    // /api/charts/me returns a different shape (`standing`), but no current
    // page consumes it — keep the surface for symmetry; treat as empty.
    const res = await apiFetch<BackendChartsResponse>('/api/charts/me');
    return toSnapshot(res);
  },
};
