import { apiFetch } from './client';
import type {
  IslandDetail,
  IslandSummary,
  SubmitResult,
  Whisper,
} from './types';

export const islandsApi = {
  list(): Promise<IslandSummary[]> {
    return apiFetch<IslandSummary[]>('/api/islands');
  },

  get(slug: string): Promise<IslandDetail> {
    return apiFetch<IslandDetail>(`/api/islands/${encodeURIComponent(slug)}`);
  },

  submit(slug: string, treasure: string): Promise<SubmitResult> {
    return apiFetch<SubmitResult>(`/api/islands/${encodeURIComponent(slug)}/submit`, {
      method: 'POST',
      json: { submitted: treasure },
    });
  },

  revealWhisper(slug: string, ordinal: 1 | 2 | 3): Promise<Whisper> {
    return apiFetch<Whisper>(
      `/api/islands/${encodeURIComponent(slug)}/whisper/${ordinal}`,
      { method: 'POST' },
    );
  },
};
