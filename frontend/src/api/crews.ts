import { apiFetch } from './client';
import type { CrewProfile } from './types';

// Bosun's POST /api/crews and /api/crews/join wrap their reply as
// `{ ok, message, crew: { id, name, ... } }`; GET /api/crews/:name returns
// the bare crew profile. Surface a flat `CrewProfile` to callers either way.

export const crewsApi = {
  async create(name: string, flag_emoji?: string): Promise<CrewProfile> {
    const res = await apiFetch<{ ok: boolean; message: string; crew: CrewProfile }>(
      '/api/crews',
      { method: 'POST', json: { name, flag_emoji } },
    );
    return res.crew;
  },

  async join(invite_code: string): Promise<CrewProfile> {
    const res = await apiFetch<{ ok: boolean; message: string; crew: CrewProfile }>(
      '/api/crews/join',
      { method: 'POST', json: { invite_code } },
    );
    return res.crew;
  },

  byName(name: string): Promise<CrewProfile> {
    // GET /api/crews/:name returns the crew object directly (no envelope).
    return apiFetch<CrewProfile>(`/api/crews/${encodeURIComponent(name)}`);
  },
};
