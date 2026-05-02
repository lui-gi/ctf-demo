import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { islandsApi } from '@/api/islands';
import type { IslandCategory, IslandSummary } from '@/api/types';
import { strings } from '@/theme/strings';
import { Badge } from '@/ui/Badge';
import { DifficultyPill, type Tier } from '@/ui/DifficultyPill';
import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';
import { ApiError } from '@/api/client';
import './Category.css';

export function Category(): JSX.Element {
  const { category } = useParams<{ category: string }>();
  const cat = (category ?? '') as IslandCategory;
  const [rows, setRows] = useState<IslandSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    islandsApi
      .list()
      .then((all) => {
        if (cancelled) return;
        setRows(all.filter((i) => i.category === cat));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof ApiError ? e.message : strings.common.error());
        setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cat]);

  const heading = strings.voyage.categoryNames[cat] ?? cat;
  const plain = strings.voyage.categoryPlainNames[cat] ?? '';
  const blurb = strings.voyage.categoryBlurbs[cat] ?? '';

  const grouped = useMemo(() => {
    const order = ['port', 'open_sea', 'cursed_depths'] as const;
    return order.map((d) => ({
      difficulty: d,
      items: (rows ?? []).filter((r) => r.difficulty === d),
    }));
  }, [rows]);

  return (
    <section aria-labelledby="cat-heading">
      <p>
        <Link to="/challenges">← {strings.voyage.backToVoyage}</Link>
      </p>
      <h1 id="cat-heading" className="display">
        {heading}
      </h1>
      {plain ? (
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-brass)',
            margin: '0.1rem 0 0.5rem',
          }}
        >
          {plain}
        </p>
      ) : null}
      {blurb ? <p style={{ color: 'var(--color-ink-on-dark-dim)' }}>{blurb}</p> : null}
      {err ? <p role="alert">{err}</p> : null}
      {rows === null ? (
        <div className="pc-category__grid">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      ) : (
        grouped.map((g) =>
          g.items.length === 0 ? null : (
            <div key={g.difficulty} className="pc-category__tier">
              <h2
                className="pc-category__tier-heading"
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span>{strings.voyage.difficultyLabels[g.difficulty]}</span>
                <DifficultyPill tier={g.difficulty as Tier} showThemed={false} />
              </h2>
              <div className="pc-category__grid">
                {g.items.map((isl) => (
                  <Link
                    key={isl.id}
                    to={`/challenges/${cat}/${isl.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit', borderBottom: 0 }}
                  >
                    <Card
                      variant="deep"
                      interactive
                      header={
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <span>{isl.title}</span>
                          <DifficultyPill tier={isl.difficulty as Tier} />
                        </div>
                      }
                      footer={
                        <span style={{ fontSize: '0.875rem' }}>
                          {strings.island.pointsValue(isl.current_points)}
                        </span>
                      }
                    >
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {isl.solved_by_crew ? (
                          <Badge tone="success">{strings.island.statusSolved}</Badge>
                        ) : null}
                        {isl.first_blood_crew_name ? (
                          <Badge tone="danger" title={isl.first_blood_crew_name}>
                            {strings.island.statusFirstBlood}
                          </Badge>
                        ) : null}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ),
        )
      )}
    </section>
  );
}
