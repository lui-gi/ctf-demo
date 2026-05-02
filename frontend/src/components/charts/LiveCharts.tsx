import { useEffect, useState } from 'react';
import { useCharts } from '@/ws/socket';
import { chartsApi } from '@/api/charts';
import type { ChartsRow, ChartsSnapshot } from '@/api/types';
import { strings } from '@/theme/strings';
import { Skeleton } from '@/ui/Skeleton';
import { Badge } from '@/ui/Badge';
import { ApiError } from '@/api/client';
import './LiveCharts.css';

export function LiveCharts(): JSX.Element {
  const live = useCharts();
  const [seed, setSeed] = useState<ChartsSnapshot | null>(null);
  const [seedErr, setSeedErr] = useState<string | null>(null);

  // Seed with REST snapshot so the table is populated immediately, then
  // WS pushes will overwrite via `live.snapshot`.
  useEffect(() => {
    let cancelled = false;
    chartsApi
      .snapshot()
      .then((s) => !cancelled && setSeed(s))
      .catch((e: unknown) => {
        if (cancelled) return;
        setSeedErr(e instanceof ApiError ? e.message : strings.common.error());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshot = live.snapshot ?? seed;

  return (
    <div className="pc-charts">
      <ConnectionLabel state={live.state} attempt={live.reconnectAttempt} />
      {(snapshot?.frozen || live.frozen) && (
        <div role="status" className="pc-charts__frozen">
          {strings.charts.frozenBanner}
        </div>
      )}
      <FirstBloodTicker entries={live.firstBloodFeed} />
      {seedErr && !snapshot ? <p role="alert">{seedErr}</p> : null}
      {!snapshot ? (
        <ChartsSkeleton />
      ) : snapshot.rows.length === 0 ? (
        <p className="pc-charts__empty">{strings.charts.empty}</p>
      ) : (
        <ChartsTable rows={snapshot.rows} />
      )}
    </div>
  );
}

function ConnectionLabel({
  state,
  attempt,
}: {
  state: ReturnType<typeof useCharts>['state'];
  attempt: number;
}): JSX.Element {
  const label =
    state === 'connected'
      ? strings.charts.connected
      : state === 'reconnecting'
        ? `${strings.charts.reconnecting} (#${attempt})`
        : state === 'disconnected'
          ? strings.charts.disconnected
          : strings.charts.reconnecting;
  const tone = state === 'connected' ? 'success' : state === 'disconnected' ? 'danger' : 'warning';
  return (
    <div className="pc-charts__conn" aria-live="polite">
      <Badge tone={tone}>{label}</Badge>
    </div>
  );
}

function FirstBloodTicker({
  entries,
}: {
  entries: ReturnType<typeof useCharts>['firstBloodFeed'];
}): JSX.Element | null {
  if (entries.length === 0) return null;
  return (
    <ul className="pc-charts__ticker" aria-live="polite" aria-label={strings.aria.firstBloodFeed}>
      {entries.map((e) => (
        <li key={e.id} className="pc-charts__ticker-item">
          {strings.charts.firstBlood(e.island_title, e.crew_name)}
        </li>
      ))}
    </ul>
  );
}

function ChartsSkeleton(): JSX.Element {
  return (
    <div className="pc-charts__table">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="pc-charts__row">
          <Skeleton width={32} height={20} />
          <Skeleton width="40%" height={20} />
          <Skeleton width={80} height={20} />
        </div>
      ))}
    </div>
  );
}

function ChartsTable({ rows }: { rows: ChartsRow[] }): JSX.Element {
  // Sort defensively — server should send sorted, but be safe.
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  return (
    <div role="table" aria-label={strings.charts.heading} className="pc-charts__table">
      <div role="row" className="pc-charts__row pc-charts__row--head">
        <span role="columnheader">{strings.charts.rank}</span>
        <span role="columnheader">{strings.charts.crew}</span>
        <span role="columnheader">{strings.charts.score}</span>
        <span role="columnheader">{strings.charts.lastSolve}</span>
      </div>
      {sorted.map((r) => (
        <div
          role="row"
          key={r.crew_id}
          className={`pc-charts__row pc-charts__row--data pc-charts__row--rank-${r.rank}`}
          // Use crew_id as React key so row reorder triggers FLIP-style transitions
          // via CSS; layout transitions on transform avoid layout thrash.
          style={{ order: r.rank }}
        >
          <span role="cell" className="pc-charts__rank">
            {strings.charts.placements[r.rank]
              ? `${r.rank} · ${strings.charts.placements[r.rank]}`
              : `${r.rank}`}
          </span>
          <span role="cell" className="pc-charts__crew">
            {r.flag_emoji ? <span aria-hidden>{r.flag_emoji} </span> : null}
            {r.crew_name}
          </span>
          <span role="cell" className="pc-charts__score">
            {strings.island.pointsValue(r.score)}
          </span>
          <span role="cell" className="pc-charts__last">
            {r.last_solve_at ? new Date(r.last_solve_at).toLocaleTimeString() : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
