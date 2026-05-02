import { apiFetch } from './client';
import type {
  AdminSubmissionRow,
  IslandDetail,
  IslandStatus,
  IslandSummary,
  Whisper,
} from './types';

export interface IslandUpsertPayload {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  base_points: number;
  description_md: string;
  flag?: string; // canonical flag — required on create
  sandbox_image?: string | null;
  status?: IslandStatus;
  whispers?: Array<{
    ordinal: 1 | 2 | 3;
    body_md: string;
    cost_points: number;
  }>;
}

export interface SubmissionsFilter {
  crew_id?: string;
  island_id?: string;
  is_correct?: boolean;
  from?: string;
  to?: string;
}

function qs(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

// Bosun envelopes responses as `{ ok: true, <key>: T }` (or with a message).
// Helmsman keeps her API surface flat — every call below unwraps to the bare
// payload type. Admin endpoints are reached through `/api/admin/*` so the Vite
// dev proxy forwards them; production edge maps both `/api/admin/*` and
// `/admin/*` to the backend, so this is a harmless dev-friendly aliasing.

export const adminApi = {
  async listIslands(): Promise<IslandSummary[]> {
    const res = await apiFetch<{ ok: boolean; islands: IslandSummary[] }>(
      '/api/islands?include_unpublished=1',
    );
    return res?.islands ?? [];
  },

  async createIsland(p: IslandUpsertPayload): Promise<IslandDetail> {
    const res = await apiFetch<{ ok: boolean; island: IslandDetail }>(
      '/api/admin/islands',
      { method: 'POST', json: p },
    );
    return res.island;
  },

  async updateIsland(id: string, p: Partial<IslandUpsertPayload>): Promise<IslandDetail> {
    const res = await apiFetch<{ ok: boolean; island: IslandDetail }>(
      `/api/admin/islands/${id}`,
      { method: 'PATCH', json: p },
    );
    return res.island;
  },

  deleteIsland(id: string): Promise<void> {
    return apiFetch<void>(`/api/admin/islands/${id}`, { method: 'DELETE' });
  },

  async setStatus(id: string, status: IslandStatus): Promise<IslandDetail> {
    const res = await apiFetch<{ ok: boolean; island: IslandDetail }>(
      `/api/admin/islands/${id}/status`,
      { method: 'PATCH', json: { status } },
    );
    return res.island;
  },

  uploadFiles(id: string, files: File[]): Promise<{ url: string; name: string }[]> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    return apiFetch(`/api/admin/islands/${id}/files`, {
      method: 'POST',
      body: fd,
    });
  },

  async addWhisper(
    id: string,
    p: { ordinal: 1 | 2 | 3; body_md: string; cost_points: number },
  ): Promise<Whisper> {
    const res = await apiFetch<{ ok: boolean; whisper: Whisper }>(
      `/api/admin/islands/${id}/whispers`,
      { method: 'POST', json: p },
    );
    return res.whisper;
  },

  rebuildSandbox(id: string): Promise<void> {
    return apiFetch<void>(`/api/admin/sandbox/${id}/rebuild`, { method: 'POST' });
  },

  recalcCharts(): Promise<void> {
    return apiFetch<void>('/api/admin/charts/recalc', { method: 'POST' });
  },

  banCrew(id: string): Promise<void> {
    return apiFetch<void>(`/api/admin/crews/${id}/ban`, { method: 'POST' });
  },

  banPirate(id: string): Promise<void> {
    return apiFetch<void>(`/api/admin/pirates/${id}/ban`, { method: 'POST' });
  },

  freezeVoyage(): Promise<void> {
    return apiFetch<void>('/api/admin/voyage/freeze', { method: 'POST' });
  },

  unfreezeVoyage(): Promise<void> {
    return apiFetch<void>('/api/admin/voyage/unfreeze', { method: 'POST' });
  },

  async submissions(filter: SubmissionsFilter = {}): Promise<AdminSubmissionRow[]> {
    const q = qs({
      crew_id: filter.crew_id,
      island_id: filter.island_id,
      is_correct:
        filter.is_correct === undefined ? undefined : String(filter.is_correct),
      from: filter.from,
      to: filter.to,
    });
    const res = await apiFetch<{ ok: boolean; submissions: AdminSubmissionRow[] }>(
      `/api/admin/submissions${q}`,
    );
    return res?.submissions ?? [];
  },
};
