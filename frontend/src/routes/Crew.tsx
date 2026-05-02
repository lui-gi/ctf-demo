import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { crewsApi } from '@/api/crews';
import type { CrewProfile } from '@/api/types';
import { strings } from '@/theme/strings';
import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';
import { Badge } from '@/ui/Badge';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';

export function Crew(): JSX.Element {
  const { name } = useParams<{ name: string }>();
  const { user } = useAuth();
  const [crew, setCrew] = useState<CrewProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!name) return;
    crewsApi
      .byName(name)
      .then((c) => {
        if (!cancelled) setCrew(c);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setErr(strings.crew.notFound);
        } else {
          setErr(e instanceof ApiError ? e.message : strings.common.error());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (err) {
    return (
      <section>
        <p role="alert">{err}</p>
      </section>
    );
  }

  if (!crew) {
    return (
      <section>
        <Skeleton height={32} width="40%" />
        <div style={{ marginTop: '1rem' }}>
          <Skeleton height={200} />
        </div>
      </section>
    );
  }

  const isOwnCrew = user?.crew?.id === crew.id;

  return (
    <article aria-labelledby="crew-heading">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 id="crew-heading" className="display">
          {strings.crew.headingPrefix}: {crew.flag_emoji ? `${crew.flag_emoji} ` : ''}
          {crew.name}
        </h1>
        <Badge tone="brass">{strings.crew.bountyTotal(crew.total_score)}</Badge>{' '}
        <span style={{ color: 'var(--color-ink-on-dark-dim)', marginLeft: 8 }}>
          {strings.crew.joined(new Date(crew.created_at).toLocaleDateString())}
        </span>
      </header>

      {isOwnCrew && crew.invite_code ? (
        <Card variant="deep" header={strings.crew.inviteCode}>
          <code style={{ fontSize: '1.1rem' }}>{crew.invite_code}</code>
        </Card>
      ) : null}

      <section aria-labelledby="members-heading" style={{ marginTop: '1.5rem' }}>
        <h2 id="members-heading">{strings.crew.membersHeading}</h2>
        <ul>
          {crew.members.map((m) => (
            <li key={m.id}>
              {m.handle}
              {m.role === 'admin' ? <Badge tone="warning">{strings.crew.roleAdminBadge}</Badge> : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="solved-heading" style={{ marginTop: '1.5rem' }}>
        <h2 id="solved-heading">{strings.crew.solvedHeading}</h2>
        {crew.solved.length === 0 ? (
          <p>{strings.charts.empty}</p>
        ) : (
          <ul>
            {crew.solved.map((s) => (
              <li key={s.island_slug}>
                {/* Crew profile API returns slug only; we link to /voyage and the
                    Voyage route handles slug→category lookup at click-time.
                    Bosun: when the crew profile endpoint includes category, we
                    can deep-link directly. Tracked as a follow-up. */}
                <Link to="/voyage">{s.island_title}</Link>{' '}
                <Badge tone="brass">{strings.island.pointsValue(s.awarded_points)}</Badge>{' '}
                <span style={{ color: 'var(--color-ink-on-dark-dim)' }}>
                  {new Date(s.solved_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
