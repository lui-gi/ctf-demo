import { Link } from 'react-router-dom';
import { strings } from '@/theme/strings';
import { LiveCharts } from '@/components/charts/LiveCharts';
import { useVoyageState } from '@/ws/socket';
import './ClosingCeremony.css';

export function Charts(): JSX.Element {
  const voyage = useVoyageState();
  return (
    <section className="pc-page" aria-labelledby="charts-heading">
      <header className="pc-page__header pc-page__header--brass">
        <p className="pc-page__eyebrow">{strings.charts.headingThemed}</p>
        <h1 id="charts-heading" className="display pc-page__title">
          {strings.charts.heading}
        </h1>
        <p className="pc-page__subtitle">{strings.charts.subtitle}</p>
      </header>
      {voyage.frozen ? (
        <div className="pc-charts-closing-banner" role="status">
          <span>{strings.charts.frozenBanner}</span>
          <Link to="/closing">{strings.closingCeremony.chartsBannerCta}</Link>
        </div>
      ) : null}
      <LiveCharts />
    </section>
  );
}
