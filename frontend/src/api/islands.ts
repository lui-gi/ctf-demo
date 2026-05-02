import { apiFetch } from './client';
import type {
  IslandDetail,
  IslandSummary,
  SubmitResult,
  Whisper,
} from './types';

// Bosun envelopes responses as `{ ok: true, <key>: T }`. We keep the
// frontend's API surface flat — every method below returns the bare payload.
// Mirrors the same pattern used in `api/admin.ts`.

export const islandsApi = {
  async list(): Promise<IslandSummary[]> {
    const res = await apiFetch<{ ok: boolean; islands: IslandSummary[] }>('/api/islands');
    return res?.islands ?? [];
  },

  async get(slug: string): Promise<IslandDetail> {
    const res = await apiFetch<{ ok: boolean; island: Partial<IslandDetail> & IslandDetail }>(
      `/api/islands/${encodeURIComponent(slug)}`,
    );
    // Bosun's `island` payload doesn't always carry `files` / `whispers`
    // arrays — older builds (and the Phase-2 schema) only emit a
    // `files_url` scalar. Coerce the optional collections to empty arrays
    // so the SPA renders the empty state instead of crashing on
    // `data.files.length` lookups.
    const island = res.island ?? ({} as IslandDetail);
    return {
      ...island,
      files: Array.isArray(island.files) ? island.files : [],
      whispers: Array.isArray(island.whispers) ? island.whispers : [],
    } as IslandDetail;
  },

  submit(slug: string, treasure: string): Promise<SubmitResult> {
    return apiFetch<SubmitResult>(`/api/islands/${encodeURIComponent(slug)}/submit`, {
      method: 'POST',
      json: { flag: treasure },
    });
  },

  async revealWhisper(slug: string, ordinal: 1 | 2 | 3): Promise<Whisper> {
    const res = await apiFetch<{ ok: boolean; whisper: Whisper }>(
      `/api/islands/${encodeURIComponent(slug)}/whisper/${ordinal}`,
      { method: 'POST' },
    );
    return res.whisper;
  },
};
