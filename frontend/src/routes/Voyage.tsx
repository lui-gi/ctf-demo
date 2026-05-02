import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { islandsApi } from '@/api/islands';
import type {
  IslandCategory,
  IslandDifficulty,
  IslandSummary,
} from '@/api/types';
import { strings } from '@/theme/strings';
import { Skeleton } from '@/ui/Skeleton';
import { Badge } from '@/ui/Badge';
import { DifficultyPill, type Tier } from '@/ui/DifficultyPill';
import { ApiError } from '@/api/client';
import './Voyage.css';

const CATEGORIES: IslandCategory[] = [
  'crows_nest',
  'cursed_ports',
  'cipher_cove',
  'shipwrights_forge',
  'lighthouse',
  'hidden_cargo',
  'keymaster',
];

const TIER_ORDER: IslandDifficulty[] = ['port', 'open_sea', 'cursed_depths'];

interface CategoryGroup {
  key: IslandCategory;
  total: number;
  solved: number;
  byTier: Record<IslandDifficulty, IslandSummary[]>;
  tierCounts: Record<IslandDifficulty, { total: number; solved: number }>;
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

  const groups = useMemo<CategoryGroup[]>(() => {
    return CATEGORIES.map((key) => {
      const inCat = (islands ?? []).filter((i) => i.category === key);
      const byTier = {
        port: inCat.filter((i) => i.difficulty === 'port'),
        open_sea: inCat.filter((i) => i.difficulty === 'open_sea'),
        cursed_depths: inCat.filter((i) => i.difficulty === 'cursed_depths'),
      };
      const tierCounts = {
        port: {
          total: byTier.port.length,
          solved: byTier.port.filter((i) => i.solved_by_crew).length,
        },
        open_sea: {
          total: byTier.open_sea.length,
          solved: byTier.open_sea.filter((i) => i.solved_by_crew).length,
        },
        cursed_depths: {
          total: byTier.cursed_depths.length,
          solved: byTier.cursed_depths.filter((i) => i.solved_by_crew).length,
        },
      };
      return {
        key,
        total: inCat.length,
        solved: inCat.filter((i) => i.solved_by_crew).length,
        byTier,
        tierCounts,
      };
    });
  }, [islands]);

  const overall = useMemo(() => {
    const all = islands ?? [];
    const solved = all.filter((i) => i.solved_by_crew);
    return {
      total: all.length,
      solved: solved.length,
      points: solved.reduce((sum, i) => sum + (i.current_points ?? 0), 0),
      easy: {
        total: all.filter((i) => i.difficulty === 'port').length,
        solved: solved.filter((i) => i.difficulty === 'port').length,
      },
      medium: {
        total: all.filter((i) => i.difficulty === 'open_sea').length,
        solved: solved.filter((i) => i.difficulty === 'open_sea').length,
      },
      hard: {
        total: all.filter((i) => i.difficulty === 'cursed_depths').length,
        solved: solved.filter((i) => i.difficulty === 'cursed_depths').length,
      },
    };
  }, [islands]);

  return (
    <section className="pc-voyage" aria-labelledby="voyage-heading">
      <header className="pc-voyage__header">
        <p className="pc-voyage__eyebrow">{strings.voyage.headingThemed}</p>
        <h1 id="voyage-heading" className="display pc-voyage__title">
          {strings.voyage.heading}
        </h1>
        <p className="pc-voyage__subtitle">{strings.voyage.subtitle}</p>
      </header>

      <ProgressStrip overall={overall} loading={islands === null} />

      <JumpNav groups={groups} loading={islands === null} />

      {err ? (
        <p role="alert" className="pc-voyage__err">
          {err}
        </p>
      ) : null}

      <div className="pc-voyage__sections">
        {groups.map((g) => (
          <CategorySection key={g.key} group={g} loading={islands === null} />
        ))}
      </div>
    </section>
  );
}

function ProgressStrip({
  overall,
  loading,
}: {
  overall: {
    total: number;
    solved: number;
    points: number;
    easy: { total: number; solved: number };
    medium: { total: number; solved: number };
    hard: { total: number; solved: number };
  };
  loading: boolean;
}): JSX.Element {
  const pct = overall.total > 0 ? Math.round((overall.solved / overall.total) * 100) : 0;
  return (
    <div className="pc-voyage__progress" role="region" aria-label={strings.voyage.overallProgress}>
      <div className="pc-voyage__progress-head">
        <span className="pc-voyage__progress-label">
          {strings.voyage.overallProgress}
        </span>
        <span className="pc-voyage__progress-numbers">
          {loading ? (
            <Skeleton width={120} height={18} />
          ) : (
            <>
              <strong>{overall.solved}</strong>
              <span aria-hidden> / </span>
              <span>{overall.total}</span>
              <span className="pc-voyage__progress-points">
                {' · '}
                {strings.voyage.overallPoints(overall.points)}
              </span>
            </>
          )}
        </span>
      </div>
      <div
        className="pc-voyage__progress-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={overall.total}
        aria-valuenow={overall.solved}
      >
        <div
          className="pc-voyage__progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="pc-voyage__progress-tiers">
        <TierMini
          label={strings.voyage.tierBarEasy}
          tone="easy"
          count={overall.easy}
        />
        <TierMini
          label={strings.voyage.tierBarMedium}
          tone="medium"
          count={overall.medium}
        />
        <TierMini
          label={strings.voyage.tierBarHard}
          tone="hard"
          count={overall.hard}
        />
      </div>
    </div>
  );
}

function TierMini({
  label,
  tone,
  count,
}: {
  label: string;
  tone: 'easy' | 'medium' | 'hard';
  count: { total: number; solved: number };
}): JSX.Element {
  return (
    <div className={`pc-voyage__tiermini pc-voyage__tiermini--${tone}`}>
      <span className="pc-voyage__tiermini-dot" aria-hidden />
      <span className="pc-voyage__tiermini-label">{label}</span>
      <span className="pc-voyage__tiermini-count">
        <strong>{count.solved}</strong>
        <span aria-hidden>/</span>
        <span>{count.total}</span>
      </span>
    </div>
  );
}

function JumpNav({
  groups,
  loading,
}: {
  groups: CategoryGroup[];
  loading: boolean;
}): JSX.Element {
  return (
    <nav className="pc-voyage__jump" aria-label={strings.voyage.jumpToLabel}>
      <span className="pc-voyage__jump-label">{strings.voyage.jumpToLabel}</span>
      <ul className="pc-voyage__jump-list">
        {groups.map((g) => (
          <li key={g.key}>
            <a
              href={`#cluster-${g.key}`}
              className={`pc-voyage__jump-chip pc-voyage__jump-chip--${g.key}`}
            >
              <span className="pc-voyage__jump-chip-name">
                {strings.voyage.categoryNames[g.key]}
              </span>
              <span className="pc-voyage__jump-chip-count">
                {loading ? '…' : `${g.solved}/${g.total}`}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategorySection({
  group,
  loading,
}: {
  group: CategoryGroup;
  loading: boolean;
}): JSX.Element {
  const themed = strings.voyage.categoryNames[group.key];
  const plain = strings.voyage.categoryPlainNames[group.key];
  const blurb = strings.voyage.categoryBlurbs[group.key];
  const headingId = `cluster-${group.key}-heading`;

  return (
    <section
      id={`cluster-${group.key}`}
      className={`pc-cluster pc-cluster--${group.key}`}
      aria-labelledby={headingId}
    >
      <div className="pc-cluster__rail" aria-hidden />
      <div className="pc-cluster__head">
        <div className="pc-cluster__head-text">
          <p className="pc-cluster__plain">{plain}</p>
          <h2 id={headingId} className="pc-cluster__themed">
            {themed}
          </h2>
          <p className="pc-cluster__blurb">{blurb}</p>
        </div>
        <Link
          to={`/challenges/${group.key}`}
          className="pc-cluster__open-link"
          aria-label={`${themed} — ${strings.voyage.sectionViewAll}`}
        >
          {strings.voyage.sectionViewAll}
          <span aria-hidden> →</span>
        </Link>
      </div>

      <div className="pc-cluster__statbar" role="group" aria-label={`${themed} stats`}>
        <ClusterStat
          variant="total"
          label={strings.voyage.tierBarTotal}
          value={group.total}
        />
        <ClusterStat
          variant="solved"
          label={strings.voyage.tierBarSolved}
          value={group.solved}
          accent={group.solved > 0}
        />
        <ClusterStat
          variant="easy"
          label={strings.voyage.tierBarEasy}
          value={group.tierCounts.port.total}
          solved={group.tierCounts.port.solved}
        />
        <ClusterStat
          variant="medium"
          label={strings.voyage.tierBarMedium}
          value={group.tierCounts.open_sea.total}
          solved={group.tierCounts.open_sea.solved}
        />
        <ClusterStat
          variant="hard"
          label={strings.voyage.tierBarHard}
          value={group.tierCounts.cursed_depths.total}
          solved={group.tierCounts.cursed_depths.solved}
        />
      </div>

      <div className="pc-cluster__body">
        {loading ? (
          <div className="pc-cluster__grid">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={108} />
            ))}
          </div>
        ) : group.total === 0 ? (
          <p className="pc-cluster__empty">{strings.voyage.sectionEmpty}</p>
        ) : (
          TIER_ORDER.map((tier) =>
            group.byTier[tier].length === 0 ? null : (
              <ChallengeTierGroup
                key={tier}
                tier={tier}
                category={group.key}
                items={group.byTier[tier]}
              />
            ),
          )
        )}
      </div>
    </section>
  );
}

function ClusterStat({
  variant,
  label,
  value,
  solved,
  accent,
}: {
  variant: 'total' | 'solved' | 'easy' | 'medium' | 'hard';
  label: string;
  value: number;
  solved?: number;
  accent?: boolean;
}): JSX.Element {
  const showSplit = solved !== undefined && value > 0;
  return (
    <div
      className={[
        'pc-cluster__stat',
        `pc-cluster__stat--${variant}`,
        accent ? 'pc-cluster__stat--accent' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="pc-cluster__stat-label">{label}</span>
      <span className="pc-cluster__stat-value">
        {showSplit ? (
          <>
            <strong>{solved}</strong>
            <span aria-hidden>/</span>
            <span>{value}</span>
          </>
        ) : (
          <strong>{value}</strong>
        )}
      </span>
    </div>
  );
}

function ChallengeTierGroup({
  tier,
  category,
  items,
}: {
  tier: IslandDifficulty;
  category: IslandCategory;
  items: IslandSummary[];
}): JSX.Element {
  return (
    <div className={`pc-cluster__tier pc-cluster__tier--${tier}`}>
      <div className="pc-cluster__tier-head">
        <DifficultyPill tier={tier as Tier} />
        <span className="pc-cluster__tier-count">
          {items.filter((i) => i.solved_by_crew).length}
          <span aria-hidden> / </span>
          {items.length}
        </span>
      </div>
      <ul className="pc-cluster__grid" role="list">
        {items.map((isl) => (
          <li key={isl.id} role="listitem">
            <Link
              to={`/challenges/${category}/${isl.slug}`}
              className={[
                'pc-chal',
                isl.solved_by_crew ? 'pc-chal--solved' : '',
                isl.first_blood_crew_name ? 'pc-chal--firstblood' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="pc-chal__row">
                <span className="pc-chal__title">{isl.title}</span>
                <span className="pc-chal__pts">
                  {strings.island.pointsValue(isl.current_points)}
                </span>
              </div>
              <div className="pc-chal__row pc-chal__row--meta">
                <DifficultyPill tier={isl.difficulty as Tier} showThemed={false} />
                <span className="pc-chal__badges">
                  {isl.solved_by_crew ? (
                    <Badge tone="success">{strings.island.statusSolved}</Badge>
                  ) : null}
                  {isl.first_blood_crew_name ? (
                    <Badge tone="danger" title={isl.first_blood_crew_name}>
                      {strings.island.statusFirstBlood}
                    </Badge>
                  ) : null}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
