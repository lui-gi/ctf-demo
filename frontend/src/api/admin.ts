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

export const adminApi = {
  listIslands(): Promise<IslandSummary[]> {
    return apiFetch<IslandSummary[]>('/api/islands?include_unpublished=1');
  },

  createIsland(p: IslandUpsertPayload): Promise<IslandDetail> {
    return apiFetch<IslandDetail>('/admin/islands', {
      method: 'POST',
      json: p,
    });
  },

  updateIsland(id: string, p: Partial<IslandUpsertPayload>): Promise<IslandDetail> {
    return apiFetch<IslandDetail>(`/admin/islands/${id}`, {
      method: 'PATCH',
      json: p,
    });
  },

  deleteIsland(id: string): Promise<void> {
    return apiFetch<void>(`/admin/islands/${id}`, { method: 'DELETE' });
  },

  setStatus(id: string, status: IslandStatus): Promise<IslandDetail> {
    return apiFetch<IslandDetail>(`/admin/islands/${id}/status`, {
      method: 'PATCH',
      json: { status },
    });
  },

  uploadFiles(id: string, files: File[]): Promise<{ url: string; name: string }[]> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    return apiFetch(`/admin/islands/${id}/files`, {
      method: 'POST',
      body: fd,
    });
  },

  addWhisper(
    id: string,
    p: { ordinal: 1 | 2 | 3; body_md: string; cost_points: number },
  ): Promise<Whisper> {
    return apiFetch<Whisper>(`/admin/islands/${id}/whispers`, {
      method: 'POST',
      json: p,
    });
  },

  rebuildSandbox(id: string): Promise<void> {
    return apiFetch<void>(`/admin/sandbox/${id}/rebuild`, { method: 'POST' });
  },

  recalcCharts(): Promise<void> {
    return apiFetch<void>('/admin/charts/recalc', { method: 'POST' });
  },

  banCrew(id: string): Promise<void> {
    return apiFetch<void>(`/admin/crews/${id}/ban`, { method: 'POST' });
  },

  banPirate(id: string): Promise<void> {
    return apiFetch<void>(`/admin/pirates/${id}/ban`, { method: 'POST' });
  },

  freezeVoyage(): Promise<void> {
    return apiFetch<void>('/admin/voyage/freeze', { method: 'POST' });
  },

  unfreezeVoyage(): Promise<void> {
    return apiFetch<void>('/admin/voyage/unfreeze', { method: 'POST' });
  },

  submissions(filter: SubmissionsFilter = {}): Promise<AdminSubmissionRow[]> {
    const q = qs({
      crew_id: filter.crew_id,
      island_id: filter.island_id,
      is_correct:
        filter.is_correct === undefined ? undefined : String(filter.is_correct),
      from: filter.from,
      to: filter.to,
    });
    return apiFetch<AdminSubmissionRow[]>(`/admin/submissions${q}`);
  },
};
