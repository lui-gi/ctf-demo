import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { islandsApi } from '@/api/islands';
import type { IslandCategory, IslandSummary } from '@/api/types';
import { strings } from '@/theme/strings';
import { Skeleton } from '@/ui/Skeleton';
import { Badge } from '@/ui/Badge';
import { ApiError } from '@/api/client';
import './Voyage.css';

const CATEGORIES: IslandCategory[] = [
  'cursed_ports',
  'cipher_cove',
  'shipwrights_forge',
  'lighthouse',
  'crows_nest',
  'hidden_cargo',
  'keymaster',
];

interface CategorySummary {
  key: IslandCategory;
  total: number;
  solved: number;
}

export function Voyage(): JSX.Element {
  const [islands, setIslands] = useState<IslandSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    islandsApi
      .list()
      .then((rows) => {
        if (!cancelled) setIslands(rows);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof ApiError ? e.message : strings.common.error());
        setIslands([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summaries = useMemo<CategorySummary[]>(() => {
    if (!islands) return [];
    return CATEGORIES.map((key) => {
      const inCat = islands.filter((i) => i.category === key);
      return {
        key,
        total: inCat.length,
        solved: inCat.filter((i) => i.solved_by_crew).length,
      };
    });
  }, [islands]);

  return (
    <section className="surface-parchment pc-voyage" aria-labelledby="voyage-heading">
      <header className="pc-voyage__header">
        <h1 id="voyage-heading" className="display">
          {strings.voyage.heading}
        </h1>
        <p
          className="pc-voyage__themed"
          style={{
            fontFamily: 'var(--font-display, "IM Fell English", Georgia, serif)',
            fontStyle: 'italic',
            opacity: 0.75,
            margin: '0 0 0.25rem',
          }}
        >
          {strings.voyage.headingThemed}
        </p>
        <p className="pc-voyage__subtitle">{strings.voyage.subtitle}</p>
      </header>
      {err ? (
        <p role="alert" className="pc-voyage__err">
          {err}
        </p>
      ) : null}
      <div className="pc-voyage__grid" role="list">
        {(islands === null ? CATEGORIES : CATEGORIES).map((key, i) => {
          const meta = summaries.find((s) => s.key === key);
          const total = meta?.total ?? 0;
          const solved = meta?.solved ?? 0;
          const themedName = strings.voyage.categoryNames[key];
          const plainName = strings.voyage.categoryPlainNames[key];
          return (
            <Link
              role="listitem"
              key={key}
              to={`/challenges/${key}`}
              className="pc-island-cluster"
              aria-label={`${themedName} — ${plainName}`}
              style={{ gridArea: `cluster-${i + 1}` }}
            >
              <div className="pc-island-cluster__shape" aria-hidden />
              <div className="pc-island-cluster__label">
                <h2>{themedName}</h2>
                <p
                  className="pc-island-cluster__plain"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    opacity: 0.78,
                    margin: '0.1rem 0 0.35rem',
                  }}
                >
                  {plainName}
                </p>
                <p>{strings.voyage.categoryBlurbs[key]}</p>
                {islands === null ? (
                  <Skeleton width={120} height={14} />
                ) : (
                  <Badge tone="brass">{strings.voyage.solveCount(solved, total)}</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
