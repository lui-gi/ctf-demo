import { Link } from 'react-router-dom'
import { STARS } from '../components/layout/starfield'

// TODO: replace with real Google Form URL when ready
const SPONSOR_FORM_URL = 'https://docs.google.com/forms/sponsor-placeholder'
// TODO: replace with real Google Form URL when ready
const INVOLVE_FORM_URL = 'https://docs.google.com/forms/involve-placeholder'

export default function SponsorPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #010310 0%, #03082e 55%, #0a1a52 100%)' }}
    >
      {STARS.map(([x, y, size, opacity], i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: '50%', background: '#fff', opacity }}
        />
      ))}

      <div
        className="absolute pointer-events-none"
        style={{
          top: '5%', left: '4%', width: 72, height: 72, borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 36%, #ffffff 0%, #f5edd8 45%, #d4c280 100%)',
          boxShadow: '0 0 30px 14px rgba(255,248,215,0.18), 0 0 70px 36px rgba(200,225,255,0.08)',
        }}
      />

      <Link
        to="/"
        className="relative font-mono font-black italic text-3xl tracking-wide mb-8"
        style={{ zIndex: 10 }}
      >
        <span className="text-white">prog</span>
        <span className="text-teal" style={{ textShadow: '0 0 24px rgba(62,207,190,0.70), 0 0 55px rgba(62,207,190,0.35)' }}>
          ctf
        </span>
      </Link>

      <h1
        className="relative text-2xl font-bold tracking-wide mb-10 text-center"
        style={{
          zIndex: 10,
          color: '#d8ffe9',
          textShadow: '0 0 12px rgba(0,255,136,0.55), 0 0 28px rgba(57,255,20,0.35)',
        }}
      >
        Support the Mission
      </h1>

      <div className="relative flex gap-6 w-full max-w-2xl" style={{ zIndex: 10 }}>
        <SponsorCard />
        <GetInvolvedCard />
      </div>

      <Link
        to="/"
        className="relative mt-6 font-mono font-bold text-xs tracking-[0.3em] uppercase px-6 py-2 rounded transition-all duration-200"
        style={{
          zIndex: 10,
          color: '#d8ffe9',
          border: '1px solid rgba(216,255,233,0.30)',
          textShadow: '0 0 10px rgba(0,255,136,0.45)',
          boxShadow: '0 0 12px rgba(0,255,136,0.08)',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(216,255,233,0.65)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 18px rgba(0,255,136,0.18)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(216,255,233,0.30)'
          ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 12px rgba(0,255,136,0.08)'
        }}
      >
        ← Home
      </Link>
    </div>
  )
}

function SponsorCard() {
  return (
    <div
      className="flex-1 rounded-[10px] p-8 flex flex-col gap-5"
      style={{
        background: 'rgba(5, 12, 40, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(62, 207, 190, 0.30)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.50), 0 0 18px rgba(62,207,190,0.08)',
      }}
    >
      <div>
        <h2 className="font-bold text-white tracking-[0.12em] uppercase mb-1.5">Sponsor</h2>
        <p className="font-mono text-teal text-[10px] tracking-[0.2em] uppercase">Why Sponsor?</p>
      </div>

      <p className="text-steel text-sm italic leading-relaxed">
        "Back the crew — and plant your flag where the best talent sails."
      </p>

      <ul className="flex flex-col gap-2.5">
        {[
          'Logo on site, challenges & prize announcements',
          'Visibility with hundreds of cybersecurity students',
          'Support open, community-run security education',
        ].map(item => (
          <li key={item} className="flex gap-2.5 items-start">
            <span className="text-amber text-xs mt-0.5 shrink-0">▸</span>
            <span className="text-steel text-sm leading-snug">{item}</span>
          </li>
        ))}
      </ul>

      <a
        href={SPONSOR_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto w-full py-2.5 bg-amber text-navy-950 font-bold text-xs tracking-[0.12em] uppercase rounded text-center hover:bg-amber/90 transition-opacity"
      >
        Become a Sponsor
      </a>
    </div>
  )
}

function GetInvolvedCard() {
  return (
    <div
      className="flex-1 rounded-[10px] p-8 flex flex-col gap-5"
      style={{
        background: 'rgba(5, 12, 40, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(62, 207, 190, 0.30)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.50), 0 0 18px rgba(62,207,190,0.08)',
      }}
    >
      <div>
        <h2 className="font-bold text-white tracking-[0.12em] uppercase mb-1.5">Get Involved</h2>
        <p className="font-mono text-teal text-[10px] tracking-[0.2em] uppercase">Why Get Involved?</p>
      </div>

      <p className="text-steel text-sm italic leading-relaxed">
        "Help our crew manage the voyage!"
      </p>

      <ul className="flex flex-col gap-2.5">
        {[
          'Help organize the competition',
          'Join a crew of passionate students',
          'Oversee and guide competitors',
        ].map(item => (
          <li key={item} className="flex gap-2.5 items-start">
            <span className="text-teal text-xs mt-0.5 shrink-0">▸</span>
            <span className="text-steel text-sm leading-snug">{item}</span>
          </li>
        ))}
      </ul>

      <a
        href={INVOLVE_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto w-full py-2.5 font-bold text-xs tracking-[0.12em] uppercase rounded text-center transition-all duration-200"
        style={{
          color: '#3ecfbe',
          background: 'rgba(62,207,190,0.15)',
          border: '1px solid rgba(62,207,190,0.50)',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(62,207,190,0.25)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(62,207,190,0.75)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(62,207,190,0.15)'
          ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(62,207,190,0.50)'
        }}
      >
        Get Involved
      </a>
    </div>
  )
}
