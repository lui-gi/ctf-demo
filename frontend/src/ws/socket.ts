import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChartsSnapshot } from '@/api/types';

/**
 * Socket.io client w/ exponential backoff reconnect.
 *
 * The socket.io client already implements its own reconnect; we configure
 * exponential backoff explicitly (1s → 2s → 4s → 8s → 16s, capped) and
 * surface connection state via React hooks.
 *
 * Cookie auth: socket.io shares the same origin as the backend (Vite proxy
 * in dev), so the httpOnly JWT cookie travels with the WS upgrade request
 * automatically. We do NOT pass any token in JS.
 */

export interface WsServerEvents {
  'charts.update': (snapshot: ChartsSnapshot) => void;
  'charts.first_blood': (payload: {
    island_slug: string;
    island_title: string;
    crew_name: string;
    awarded_at: string;
  }) => void;
  'voyage.frozen': () => void;
  'voyage.unfrozen': () => void;
  'island.published': (payload: { slug: string; title: string }) => void;
  'island.archived': (payload: { slug: string }) => void;
}

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket) return _socket;
  _socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 16000,
    randomizationFactor: 0.2,
    autoConnect: true,
  });
  return _socket;
}

export function disposeSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface UseChartsResult {
  snapshot: ChartsSnapshot | null;
  state: ConnectionState;
  reconnectAttempt: number;
  /** First-blood announcements pushed by the server, ordered newest-first. */
  firstBloodFeed: Array<{
    id: string;
    island_slug: string;
    island_title: string;
    crew_name: string;
    awarded_at: string;
  }>;
  frozen: boolean;
}

/**
 * Subscribe to live Charts updates + first-blood ticker.
 *
 * The hook seeds with `null`; an initial snapshot will arrive within ~5s of
 * connect (per spec §7) — Charts.tsx renders a Skeleton until then.
 */
export function useCharts(): UseChartsResult {
  const [snapshot, setSnapshot] = useState<ChartsSnapshot | null>(null);
  const [state, setState] = useState<ConnectionState>('connecting');
  const [attempt, setAttempt] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [firstBloodFeed, setFirstBloodFeed] = useState<UseChartsResult['firstBloodFeed']>([]);
  const counter = useRef(0);

  useEffect(() => {
    const s = getSocket();

    const onConnect = (): void => {
      setState('connected');
      setAttempt(0);
    };
    const onDisconnect = (): void => setState('disconnected');
    const onReconnectAttempt = (n: number): void => {
      setState('reconnecting');
      setAttempt(n);
    };
    const onChartsUpdate = (snap: ChartsSnapshot): void => {
      setSnapshot(snap);
      setFrozen(Boolean(snap.frozen));
    };
    const onFirstBlood = (p: {
      island_slug: string;
      island_title?: string;
      crew_name: string;
      awarded_at: string;
    }): void => {
      const entry = {
        id: `fb-${Date.now()}-${counter.current++}`,
        island_slug: p.island_slug,
        island_title: p.island_title ?? p.island_slug,
        crew_name: p.crew_name,
        awarded_at: p.awarded_at,
      };
      setFirstBloodFeed((prev) => [entry, ...prev].slice(0, 8));
    };
    const onFrozen = (): void => setFrozen(true);
    const onUnfrozen = (): void => setFrozen(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.io.on('reconnect_attempt', onReconnectAttempt);
    s.on('charts.update', onChartsUpdate);
    s.on('charts.first_blood', onFirstBlood);
    s.on('voyage.frozen', onFrozen);
    s.on('voyage.unfrozen', onUnfrozen);

    if (s.connected) {
      onConnect();
    } else {
      setState('connecting');
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.io.off('reconnect_attempt', onReconnectAttempt);
      s.off('charts.update', onChartsUpdate);
      s.off('charts.first_blood', onFirstBlood);
      s.off('voyage.frozen', onFrozen);
      s.off('voyage.unfrozen', onUnfrozen);
    };
  }, []);

  return { snapshot, state, reconnectAttempt: attempt, firstBloodFeed, frozen };
}

export interface VoyageStateResponse {
  frozen: boolean;
  // Bosun may extend this; we only consume `frozen` today.
}

export interface UseVoyageStateResult {
  frozen: boolean;
  /** True until either the REST seed or the first WS event lands. */
  loading: boolean;
}

/**
 * Subscribe to voyage freeze/unfreeze and seed from REST.
 *
 * We seed via `GET /api/voyage/state` so a fresh page load knows the freeze
 * status without waiting for a WS push. If the endpoint is missing (older
 * Bosun build), we silently default to `frozen=false` and rely on the live
 * `voyage.frozen` / `voyage.unfrozen` events to toggle state thereafter.
 */
export function useVoyageState(): UseVoyageStateResult {
  const [frozen, setFrozen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/voyage/state', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        try {
          return (await res.json()) as VoyageStateResponse;
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.frozen === 'boolean') {
          setFrozen(data.frozen);
        }
        setLoading(false);
      })
      .catch(() => {
        // Endpoint absent / network down — graceful default.
        if (!cancelled) setLoading(false);
      });

    const s = getSocket();
    const onFrozen = (): void => setFrozen(true);
    const onUnfrozen = (): void => setFrozen(false);
    const onChartsUpdate = (snap: ChartsSnapshot): void => {
      // Charts snapshots also carry the freeze flag — keep state consistent.
      if (typeof snap.frozen === 'boolean') setFrozen(snap.frozen);
    };

    s.on('voyage.frozen', onFrozen);
    s.on('voyage.unfrozen', onUnfrozen);
    s.on('charts.update', onChartsUpdate);

    return () => {
      cancelled = true;
      s.off('voyage.frozen', onFrozen);
      s.off('voyage.unfrozen', onUnfrozen);
      s.off('charts.update', onChartsUpdate);
    };
  }, []);

  return { frozen, loading };
}
