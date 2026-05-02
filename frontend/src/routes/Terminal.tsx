import { useState } from 'react';
import { strings } from '@/theme/strings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { MockTerminalIframe } from '@/components/terminal/MockTerminalIframe';

export function Terminal(): JSX.Element {
  const [slug, setSlug] = useState('');
  const [active, setActive] = useState<string | null>(null);

  return (
    <section aria-labelledby="terminal-heading">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 id="terminal-heading" className="display">
          {strings.terminal.heading}
        </h1>
        <p style={{ color: 'var(--color-ink-on-dark-dim)' }}>{strings.terminal.subtitle}</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActive(slug.trim() || null);
        }}
        style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '1rem' }}
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
