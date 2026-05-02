import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { islandsApi } from '@/api/islands';
import type { IslandDetail, Whisper } from '@/api/types';
import { strings } from '@/theme/strings';
import { Badge } from '@/ui/Badge';
import { DifficultyPill, type Tier } from '@/ui/DifficultyPill';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { Skeleton } from '@/ui/Skeleton';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';
import { Markdown } from '@/lib/markdown';
import './Island.css';

const FLAG_RE = /^progctf\{[a-z0-9_]+\}$/;

export function Island(): JSX.Element {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const toast = useToast();
  const [data, setData] = useState<IslandDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [treasure, setTreasure] = useState('');
  const [cooldown, setCooldown] = useState<number>(0);
  const [revealing, setRevealing] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      const d = await islandsApi.get(slug);
      setData(d);
    } catch (e) {
      setLoadErr(e instanceof ApiError ? e.message : strings.common.error());
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Cooldown countdown for 429 responses
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!slug) return;
    setSubmitErr(null);
    if (!FLAG_RE.test(treasure.trim())) {
      setSubmitErr(strings.island.invalidFormat);
      return;
    }
    setSubmitting(true);
    try {
      const r = await islandsApi.submit(slug, treasure.trim());
      if (r.correct) {
        toast.push({
          message: strings.island.correct(r.awarded_points, r.crew_name),
          variant: 'success',
          durationMs: 6000,
        });
        setTreasure('');
        await refresh();
      } else {
        toast.push({
          message: strings.island.wrong,
          variant: 'error',
          durationMs: 4000,
        });
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          const wait = e.retryAfterSeconds ?? 30;
          setCooldown(wait);
          setSubmitErr(strings.island.cooldown(wait));
        } else if (e.code === 'voyage_frozen' || e.status === 423) {
          setSubmitErr(strings.island.frozenLocked);
        } else if (e.code === 'already_solved') {
          setSubmitErr(strings.island.alreadySolved);
        } else {
          setSubmitErr(e.message);
        }
      } else {
        setSubmitErr(strings.common.error());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onRevealWhisper = async (w: Whisper): Promise<void> => {
    if (!slug) return;
    setRevealing(w.ordinal);
    try {
      const revealed = await islandsApi.revealWhisper(slug, w.ordinal);
      setData((prev) =>
        prev
          ? {
              ...prev,
              whispers: prev.whispers.map((x) =>
                x.ordinal === revealed.ordinal ? { ...revealed, revealed: true } : x,
              ),
            }
          : prev,
      );
      toast.push({
        message: strings.island.whisperRevealed,
        variant: 'info',
        durationMs: 3000,
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : strings.common.error();
      toast.push({ message: msg, variant: 'error', durationMs: 4000 });
    } finally {
      setRevealing(null);
    }
  };

  if (loadErr) {
    return (
      <section>
        <p>
          <Link to={`/challenges/${category ?? ''}`}>← {strings.voyage.backToVoyage}</Link>
        </p>
        <p role="alert">{loadErr}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <Skeleton height={32} width="50%" />
        <div style={{ marginTop: '1rem' }}>
          <Skeleton height={200} />
        </div>
      </section>
    );
  }

  const submitButtonLabel = cooldown > 0
    ? strings.island.cooldown(cooldown)
    : submitting
      ? strings.island.submitWorking
      : strings.island.submitButton;

  return (
    <article aria-labelledby="island-heading" className="pc-island">
      <p>
        <Link to={`/challenges/${data.category}`}>← {strings.voyage.backToVoyage}</Link>
      </p>

      <header className="pc-island__head">
        <div>
          <h1 id="island-heading" className="display">
            {data.title}
          </h1>
          <div className="pc-island__meta">
            <DifficultyPill tier={data.difficulty as Tier} />
            <Badge tone="brass">
              {strings.island.pointsLabel}: {strings.island.pointsValue(data.current_points)}
            </Badge>
            {data.solved_by_crew ? (
              <Badge tone="success">{strings.island.statusSolved}</Badge>
            ) : null}
            {data.first_blood_crew_name ? (
              <Badge tone="danger" title={data.first_blood_crew_name}>
                {strings.island.statusFirstBlood}
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <section aria-labelledby="island-desc">
        <h2 id="island-desc" className="visually-hidden-section-heading">
          {strings.island.descriptionHeading}
        </h2>
        <Card variant="parchment">
          <Markdown source={data.description_md} />
        </Card>
      </section>

      <section aria-labelledby="island-files">
        <h2 id="island-files">{strings.island.filesHeading}</h2>
        {data.files.length === 0 ? (
          <p>{strings.island.filesEmpty}</p>
        ) : (
          <ul className="pc-island__files">
            {data.files.map((f) => (
              <li key={f.url}>
                <a href={f.url} download>
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="whispers-heading">
        <h2 id="whispers-heading">{strings.island.whispersHeading}</h2>
        {data.whispers.length === 0 ? (
          <p>{strings.island.whispersEmpty}</p>
        ) : (
          <ol className="pc-island__whispers">
            {data.whispers.map((w) => (
              <li key={w.id}>
                {w.revealed ? (
                  <Card variant="parchment">
                    <Markdown source={w.body_md} />
                  </Card>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => onRevealWhisper(w)}
                    loading={revealing === w.ordinal}
                  >
                    {revealing === w.ordinal
                      ? strings.island.whisperRevealing
                      : strings.island.revealWhisper(w.cost_points)}
                  </Button>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="submit-heading">
        <h2 id="submit-heading">{strings.island.submitHeading}</h2>
        <form onSubmit={onSubmit} noValidate className="pc-island__submit">
          <Input
            label={strings.island.submitHeading}
            placeholder={strings.island.submitPlaceholder}
            value={treasure}
            onChange={(e) => setTreasure(e.target.value)}
            error={submitErr ?? undefined}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting || cooldown > 0}
          />
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={cooldown > 0 || data.solved_by_crew}
          >
            {submitButtonLabel}
          </Button>
        </form>
      </section>
    </article>
  );
}
