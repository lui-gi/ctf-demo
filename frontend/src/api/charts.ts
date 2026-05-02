import { apiFetch } from './client';
import type { ChartsSnapshot } from './types';

export const chartsApi = {
  snapshot(): Promise<ChartsSnapshot> {
    return apiFetch<ChartsSnapshot>('/api/charts');
  },

  me(): Promise<ChartsSnapshot> {
    return apiFetch<ChartsSnapshot>('/api/charts/me');
  },
};
