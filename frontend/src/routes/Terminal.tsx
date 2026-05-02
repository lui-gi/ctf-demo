import { useState } from 'react';
import { strings } from '@/theme/strings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { MockTerminalIframe } from '@/components/terminal/MockTerminalIframe';

export function Terminal(): JSX.Element {
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState<string | null>(null);

  return (
    <section className="pc-page" aria-labelledby="terminal-heading">
      <header className="pc-page__header pc-page__header--verdigris">
        <p className="pc-page__eyebrow">{strings.nav.terminal}</p>
        <h1 id="terminal-heading" className="display pc-page__title">
          {strings.terminal.heading}
        </h1>
        <p className="pc-page__subtitle">{strings.terminal.subtitle}</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActive(slug.trim() || null);
        }}
        style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}
      >
        <Input
          label={strings.terminal.slugLabel}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" variant="primary">
          {strings.terminal.openButton}
        </Button>
      </form>

      {active ? <MockTerminalIframe islandSlug={active} /> : null}
    </section>
  );
}
