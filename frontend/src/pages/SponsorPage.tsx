import { Link } from 'react-router-dom'
import { CompassRose, Scroll, Coins } from '../components/ui/PirateMotifs'

// TODO: replace with real Google Form URL when ready
const SPONSOR_FORM_URL = 'https://docs.google.com/forms/sponsor-placeholder'
// TODO: replace with real Google Form URL when ready
const INVOLVE_FORM_URL = 'https://docs.google.com/forms/involve-placeholder'

export default function SponsorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="swirl-backdrop" aria-hidden />

      <Link
        to="/"
        className="relative font-poster italic text-3xl tracking-wide mb-8 flex items-center gap-2"
        style={{ zIndex: 10, color: '#2a1a08' }}
      >
        <span style={{ color: '#5a3a1a' }} className="animate-compass">
          <CompassRose size={28} strokeWidth={1.4} />
        </span>
        <span>prog</span>
        <span style={{ color: '#8a2a1f' }}>ctf</span>
      </Link>

      <h1
        className="relative h-poster mb-10 text-center"
        style={{ zIndex: 10, fontSize: '1.8rem', fontWeight: 800 }}
      >
        Support the Mission
      </h1>

      <div className="relative flex flex-col md:flex-row gap-6 w-full max-w-2xl" style={{ zIndex: 10 }}>
        <SponsorCard />
        <GetInvolvedCard />
      </div>

      <Link to="/" className="relative mt-8 btn-ink" style={{ zIndex: 10 }}>
        ← Home
      </Link>
    </div>
  )
}

function SponsorCard() {
  return (
    <div className="flex-1 parchment-card p-7 flex flex-col gap-5 relative">
      <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
      <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />

      <div className="flex items-start gap-3">
        <span style={{ color: '#8a2a1f' }}><Coins size={26} strokeWidth={1.4} /></span>
        <div>
          <h2
            className="h-poster"
            style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}
          >
            Sponsor
          </h2>
          <p
            className="font-poster mt-1"
            style={{ fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a2a1f' }}
          >
            Why Sponsor?
          </p>
        </div>
      </div>

      <p className="italic leading-relaxed font-poster ink-soft" style={{ fontSize: '1.05rem', borderLeft: '3px solid #c9a96a', paddingLeft: '0.75rem' }}>
        "Back the crew — and plant your flag where the best talent sails."
      </p>

      <ul className="flex flex-col gap-2.5">
        {[
          'Logo on site, challenges & prize announcements',
          'Visibility with hundreds of cybersecurity students',
          'Support open, community-run security education',
        ].map(item => (
          <li key={item} className="flex gap-2.5 items-start">
            <span className="mt-0.5 shrink-0" style={{ fontSize: '0.85rem', color: '#c9962a', fontWeight: 700 }}>▸</span>
            <span className="leading-snug font-poster" style={{ fontSize: '1.05rem', color: '#2a1a08' }}>{item}</span>
          </li>
        ))}
      </ul>

      <a
        href={SPONSOR_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto btn-doubloon w-full text-center"
      >
        Become a Sponsor
      </a>
    </div>
  )
}

function GetInvolvedCard() {
  return (
    <div className="flex-1 parchment-card p-7 flex flex-col gap-5 relative">
      <span className="stamp-corner stamp-corner--tl" /><span className="stamp-corner stamp-corner--tr" />
      <span className="stamp-corner stamp-corner--bl" /><span className="stamp-corner stamp-corner--br" />

      <div className="flex items-start gap-3">
        <span style={{ color: '#8a2a1f' }}><Scroll size={26} strokeWidth={1.4} /></span>
        <div>
          <h2
            className="h-poster"
            style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}
          >
            Get Involved
          </h2>
          <p
            className="font-poster mt-1"
            style={{ fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a2a1f' }}
          >
            Why Get Involved?
          </p>
        </div>
      </div>

      <p className="italic leading-relaxed font-poster ink-soft" style={{ fontSize: '1.05rem', borderLeft: '3px solid #c9a96a', paddingLeft: '0.75rem' }}>
        "Help our crew manage the voyage!"
      </p>

      <ul className="flex flex-col gap-2.5">
        {[
          'Help organize the competition',
          'Join a crew of passionate students',
          'Oversee and guide competitors',
        ].map(item => (
          <li key={item} className="flex gap-2.5 items-start">
            <span className="mt-0.5 shrink-0" style={{ fontSize: '0.85rem', color: '#c9962a', fontWeight: 700 }}>▸</span>
            <span className="leading-snug font-poster" style={{ fontSize: '1.05rem', color: '#2a1a08' }}>{item}</span>
          </li>
        ))}
      </ul>

      <a
        href={INVOLVE_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto btn-stamp w-full text-center"
      >
        Get Involved
      </a>
    </div>
  )
}
