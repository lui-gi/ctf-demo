import { Link } from 'react-router-dom';
import { strings } from '@/theme/strings';
import { LiveCharts } from '@/components/charts/LiveCharts';
import { useVoyageState } from '@/ws/socket';
import './ClosingCeremony.css';

export function Charts(): JSX.Element {
  const voyage = useVoyageState();
  return (
    <section aria-labelledby="charts-heading">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 id="charts-heading" className="display">
          {strings.charts.heading}
        </h1>
        <p style={{ color: 'var(--color-ink-on-dark-dim)' }}>{strings.charts.subtitle}</p>
      </header>
      {voyage.frozen ? (
        <div className="pc-charts-closing-banner" role="status">
          <span>{strings.charts.frozenBanner}</span>
          <Link to="/voyage/closing">{strings.closingCeremony.chartsBannerCta}</Link>
        </div>
      ) : null}
      <LiveCharts />
    </section>
  );
}
