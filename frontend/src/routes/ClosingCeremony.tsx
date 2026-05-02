import { useEffect, useState } from 'react';
import { chartsApi } from '@/api/charts';
import type { ChartsRow, ChartsSnapshot } from '@/api/types';
import { ApiError } from '@/api/client';
import { strings } from '@/theme/strings';
import { useVoyageState } from '@/ws/socket';
import { CALYPSO_LETTER_LINES } from '@/closing-ceremony/letter';
import './ClosingCeremony.css';

/**
 * Closing Ceremony — post-freeze reveal screen.
 *
 * Renders the locked Calypso letter (narrative anchor from Island #12) plus
 * the final standings (top 3) once the Voyage is frozen. While the Voyage is
 * still afoot, we render a friendly themed placeholder so deep-linkers don't
 * see a half-baked or empty page.
 */
export function ClosingCeremony(): JSX.Element {
  const voyage = useVoyageState();

  return (
    <section className="surface-parchment pc-closing" aria-labelledby="closing-heading">
      <div className="pc-closing__inner">
        {voyage.frozen ? (
          <RevealedCeremony />
        ) : (
          <PlaceholderCeremony loading={voyage.loading} />
        )}
      </div>
    </section>
  );
}

function PlaceholderCeremony({ loading }: { loading: boolean }): JSX.Element {
  return (
    <div className="pc-closing__placeholder" role="status" aria-live="polite">
      <h1 id="closing-heading" className="display">
        {strings.closingCeremony.notYetHeading}
      </h1>
      <p>{loading ? strings.common.loading : strings.closingCeremony.notYet}</p>
    </div>
  );
}

function RevealedCeremony(): JSX.Element {
  const [snapshot, setSnapshot] = useState<ChartsSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    chartsApi
      .snapshot()
      .then((s) => {
        if (!cancelled) setSnapshot(s);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof ApiError ? e.message : strings.common.error());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="pc-closing__header">
        <h1 id="closing-heading" className="display">
          {strings.closingCeremony.header}
        </h1>
      </header>

      <section
        className="pc-closing__placements"
        aria-label={strings.closingCeremony.sectionLabelStandings}
      >
        {snapshot === null && err === null ? (
          <p className="pc-closing__loading">{strings.closingCeremony.loadingTopThree}</p>
        ) : err ? (
          <p role="alert">{err}</p>
        ) : (
          <Placements rows={snapshot?.rows ?? []} />
        )}
      </section>

      <p className="pc-closing__intro">{strings.closingCeremony.letterIntro}</p>

      <article
        className="pc-closing__letter"
        aria-label={strings.closingCeremony.sectionLabelLetter}
      >
        <Letter />
      </article>

      <p className="pc-closing__final">{strings.closingCeremony.finalLine}</p>
    </>
  );
}

function Placements({ rows }: { rows: ChartsRow[] }): JSX.Element {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const byRank = new Map<number, ChartsRow>();
  for (const r of sorted) {
    if (!byRank.has(r.rank)) byRank.set(r.rank, r);
  }
  const entries: { rank: 1 | 2 | 3; title: string; row: ChartsRow | undefined }[] = [
    { rank: 1, title: strings.closingCeremony.pirateKing, row: byRank.get(1) },
    { rank: 2, title: strings.closingCeremony.emperorYonko, row: byRank.get(2) },
    { rank: 3, title: strings.closingCeremony.warlordOfTheSea, row: byRank.get(3) },
  ];
  return (
    <>
      {entries.map((e) => (
        <div key={e.rank} className="pc-closing__placement">
          <span className="pc-closing__placement-title">{e.title}</span>
          {e.row ? (
            <span className="pc-closing__placement-crew">
              {e.row.flag_emoji ? <span aria-hidden>{e.row.flag_emoji} </span> : null}
              {e.row.crew_name}
            </span>
          ) : (
            <span className="pc-closing__placement-crew pc-closing__placement-crew--missing">
              {strings.closingCeremony.crewMissing}
            </span>
          )}
        </div>
      ))}
    </>
  );
}

/**
 * Renders the Calypso letter from the locked CALYPSO_LETTER_LINES constant.
 * Empty entries are paragraph breaks; non-empty entries are <p> blocks. We
 * deliberately do NOT pass through any markdown / sanitizer — the source is
 * a hard-coded module-level string array, not user input.
 */
function Letter(): JSX.Element {
  const paragraphs: string[] = [];
  let buf: string[] = [];
  for (const line of CALYPSO_LETTER_LINES) {
    if (line === '') {
      if (buf.length > 0) {
        paragraphs.push(buf.join(' '));
        buf = [];
      }
    } else {
      buf.push(line);
    }
  }
  if (buf.length > 0) paragraphs.push(buf.join(' '));

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export default ClosingCeremony;
