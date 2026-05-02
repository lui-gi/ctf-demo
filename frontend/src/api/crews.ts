import { apiFetch } from './client';
import type { CrewProfile } from './types';

export const crewsApi = {
  create(name: string, flag_emoji?: string): Promise<CrewProfile> {
    return apiFetch<CrewProfile>('/api/crews', {
      method: 'POST',
      json: { name, flag_emoji },
    });
  },

  join(invite_code: string): Promise<CrewProfile> {
    return apiFetch<CrewProfile>('/api/crews/join', {
      method: 'POST',
      json: { invite_code },
    });
  },

  byName(name: string): Promise<CrewProfile> {
    return apiFetch<CrewProfile>(`/api/crews/${encodeURIComponent(name)}`);
  },
};
