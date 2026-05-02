import { Link } from 'react-router-dom';
import { strings } from '@/theme/strings';

export function NotFound(): JSX.Element {
  return (
    <section style={{ textAlign: 'center', padding: '4rem 1rem' }} aria-labelledby="nf-heading">
      <h1 id="nf-heading" className="display" style={{ color: 'var(--color-brass)' }}>
        {strings.common.notFoundHeading}
      </h1>
      <p style={{ fontSize: '1.125rem', color: 'var(--color-ink-on-dark-dim)' }}>
        {strings.common.notFound}
      </p>
      <p>
        <Link to="/voyage" className="pc-btn pc-btn--secondary pc-btn--md">
          {strings.common.notFoundCta}
        </Link>
      </p>
    </section>
  );
}
