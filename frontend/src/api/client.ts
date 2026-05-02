import { strings } from '@/theme/strings';

/**
 * Thin fetch wrapper.
 *
 * - Always sends cookies (`credentials: 'include'`) so the JWT in the httpOnly
 *   cookie set by Bosun's auth gateway flows through.
 * - Normalizes error shape: `{ status, code, message, retryAfterSeconds? }`.
 * - Surfaces 429s with the `Retry-After` header so the submission UI can
 *   render the themed cooldown countdown.
 *
 * The wrapper is provider-agnostic: it does NOT touch tokens directly.
 * If a request returns 401, the caller is expected to re-route to /login.
 */

export interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds?: number;
  readonly details?: unknown;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    retryAfterSeconds?: number;
    details?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.retryAfterSeconds = opts.retryAfterSeconds;
    this.details = opts.details;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  json?: unknown;
  body?: BodyInit | null;
  /** When true, do NOT throw on non-2xx. Caller handles status. */
  raw?: boolean;
}

const BASE = '';

function parseRetryAfter(h: string | null): number | undefined {
  if (!h) return undefined;
  const n = Number(h);
  if (Number.isFinite(n) && n >= 0) return Math.ceil(n);
  // HTTP-date form
  const t = Date.parse(h);
  if (!Number.isNaN(t)) {
    const delta = Math.ceil((t - Date.now()) / 1000);
    return delta > 0 ? delta : 0;
  }
  return undefined;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { json, raw, headers, body, ...rest } = opts;
  const finalHeaders = new Headers(headers ?? {});
  let finalBody: BodyInit | null | undefined = body ?? null;
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(json);
  }
  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch (networkErr) {
    throw new ApiError({
      status: 0,
      code: 'network',
      message: strings.toast.networkDown,
      details: networkErr,
    });
  }

  if (raw) {
    return res as unknown as T;
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = res.headers.get('Content-Type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    const body = (payload ?? {}) as ApiErrorBody;
    throw new ApiError({
      status: res.status,
      code: body.code ?? `http_${res.status}`,
      message: body.message ?? strings.common.error(),
      retryAfterSeconds:
        res.status === 429 ? parseRetryAfter(res.headers.get('Retry-After')) : undefined,
      details: body.details,
    });
  }

  return (payload as T) ?? (undefined as unknown as T);
}
