import { Link } from 'react-router-dom';
import { strings } from '@/theme/strings';
import './Landing.css';

export function Landing(): JSX.Element {
  return (
    <section className="pc-landing" aria-labelledby="landing-heading">
      <div className="pc-landing__crest" aria-hidden>
        ⚓
      </div>
      <h1 id="landing-heading" className="display">
        {strings.auth.landingHeading}
      </h1>
      <p className="pc-landing__lede">{strings.auth.landingBlurb}</p>
      <div className="pc-landing__cta">
        <Link to="/sign-articles" className="pc-btn pc-btn--primary pc-btn--lg">
          {strings.nav.signLink}
        </Link>
        <Link to="/board" className="pc-btn pc-btn--secondary pc-btn--lg">
          {strings.nav.boardLink}
        </Link>
      </div>
    </section>
  );
}
