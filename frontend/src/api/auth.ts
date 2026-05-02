import { apiFetch } from './client';
import type { AuthMe } from './types';

export interface SignArticlesPayload {
  email: string;
  handle: string;
  password: string;
}

export interface BoardPayload {
  email: string;
  password: string;
}

export const authApi = {
  signArticles(p: SignArticlesPayload): Promise<AuthMe> {
    return apiFetch<AuthMe>('/api/auth/sign-articles', {
      method: 'POST',
      json: p,
    });
  },

  board(p: BoardPayload): Promise<AuthMe> {
    return apiFetch<AuthMe>('/api/auth/board', {
      method: 'POST',
      json: p,
    });
  },

  me(): Promise<AuthMe> {
    return apiFetch<AuthMe>('/api/auth/me');
  },

  logout(): Promise<void> {
    return apiFetch<void>('/api/auth/logout', { method: 'POST' });
  },
};
