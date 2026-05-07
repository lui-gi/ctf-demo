import { Link } from 'react-router-dom'

const STARS: [number, number, number][] = [
  [4, 8, 3], [7, 22, 2], [3, 38, 2], [6, 55, 3], [2, 70, 2], [9, 85, 3],
  [14, 93, 2], [11, 45, 2], [18, 30, 3], [16, 65, 2], [22, 78, 2], [5, 95, 3],
  [25, 15, 2], [20, 50, 2], [8, 42, 3], [13, 73, 2], [19, 88, 2], [24, 33, 3],
  [10, 60, 2], [15, 48, 2], [28, 20, 3], [26, 82, 2], [12, 10, 2], [21, 40, 3],
  [17, 57, 2], [23, 67, 2], [6, 77, 3], [29, 5, 2],
]

const CATEGORIES = [
  { icon: '⚓', name: 'Cursed Ports',       subtitle: 'Web Exploitation',      flavor: 'Find the cracks in the hull and take the wheel.' },
  { icon: '🔐', name: 'Cipher Cove',        subtitle: 'Cryptography',           flavor: 'Crack ancient codes and hidden messages of the deep.' },
  { icon: '🔧', name: "Shipwright's Forge", subtitle: 'Network & Log Analysis', flavor: "Trace the ship's path through turbulent waters." },
  { icon: '🔦', name: 'Lighthouse',         subtitle: 'Forensics',              flavor: 'Illuminate what others buried in the dark.' },
  { icon: '🔭', name: "Crow's Nest",        subtitle: 'OSINT',                  flavor: 'Scout the horizon and find what no map will show you.' },
  { icon: '📦', name: 'Hidden Cargo',       subtitle: 'Steganography',          flavor: 'Secrets hidden in plain sight within the cargo hold.' },
  { icon: '🗝️', name: 'Keymaster',          subtitle: 'Password Cracking',      flavor: 'Every lock has a weakness if you know where to look.' },
]

const SPONSORED = [
  {
    sponsor: 'CrowdStrike',
    category: 'Cursed Ports',
    flavor: 'Challenges built around real-world endpoint threats and adversary tradecraft. Think you can outmaneuver the falcon?',
  },
  {
    sponsor: 'Sophos',
    category: 'Lighthouse',
    flavor: 'Forensics challenges inspired by real threat investigations. Dig through the artifacts — the evidence is all there.',
  },
  {
    sponsor: 'Equifax',
    category: 'Cipher Cove',
    flavor: 'Cryptography challenges drawn from financial data security. Protect the vault — or crack it.',
  },
]

function SectionDivider() {
  return (
    <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(62,207,190,0.25), transparent)' }} />
  )
}

export default function LandingPage() {
  const scrollToAbout = () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      {/* ── HERO ── */}
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #010310 0%, #03082e 18%, #070f3a 40%, #0c1f6a 58%, #0a1a58 75%, #050d38 90%, #030820 100%)' }}
      >
        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 1 }}>
          {STARS.map(([top, left, size], i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity: 0.25 + (i % 5) * 0.12,
              }}
            />
          ))}
        </div>

        {/* Moon */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 2,
            top: '5%',
            left: '11%',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 36% 36%, #ffffff 0%, #f5edd8 45%, #d4c280 100%)',
            boxShadow: '0 0 50px 28px rgba(255,248,215,0.22), 0 0 110px 60px rgba(200,225,255,0.10)',
          }}
        />

        {/* Clouds */}
        <img
          src="/assets/clouds.png"
          alt=""
          className="absolute pointer-events-none select-none w-full"
          style={{ zIndex: 2, top: 0, left: 0, opacity: 0.22, mixBlendMode: 'screen' }}
        />

        {/* Mid-ground hills */}
        <svg
          className="absolute pointer-events-none w-full"
          style={{ zIndex: 3, bottom: '18%', left: 0 }}
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 200 Q180 65 400 115 Q620 165 830 78 Q1030 0 1240 72 Q1360 118 1440 88 L1440 200 Z" fill="#0b1a58" opacity="0.50" />
          <path d="M0 200 Q230 108 460 148 Q680 188 890 118 Q1090 55 1295 122 Q1390 158 1440 138 L1440 200 Z" fill="#0d2070" opacity="0.60" />
        </svg>

        {/* Water surface */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 3,
            bottom: 0, left: 0, right: 0,
            height: '22%',
            background: 'linear-gradient(180deg, transparent 0%, #05102a 25%, #040d22 60%, #030918 100%)',
          }}
        />

        {/* Moonlight streak */}
        <div
          className="absolute pointer-events-none"
          style={{
            zIndex: 3,
            bottom: '3%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '160px',
            height: '140px',
            background: 'radial-gradient(ellipse at 50% 10%, rgba(255,250,205,0.12) 0%, rgba(255,250,205,0.05) 50%, transparent 100%)',
            filter: 'blur(14px)',
          }}
        />

        {/* Nav */}
        <nav className="relative flex items-center justify-end gap-4 px-10 py-4" style={{ zIndex: 10 }}>
          <Link to="/login" className="text-steel text-sm px-4 py-1.5 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm px-4 py-1.5 bg-teal text-black font-semibold rounded hover:opacity-90 transition-opacity"
          >
            Register
          </Link>
        </nav>

        {/* Content column */}
        <div className="relative flex-1 flex flex-col items-center justify-between pb-16 px-4" style={{ zIndex: 10 }}>
          {/* Wordmark */}
          <div className="flex flex-col items-center text-center pt-2">
            <h1
              className="font-mono font-black italic tracking-wide leading-none mb-3"
              style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
            >
              <span className="text-white">prog</span>
              <span
                className="text-teal"
                style={{ textShadow: '0 0 24px rgba(62,207,190,0.80), 0 0 55px rgba(62,207,190,0.45), 0 0 100px rgba(62,207,190,0.20)' }}
              >
                ctf
              </span>
            </h1>
            <p className="text-white font-bold text-xs tracking-[0.4em] uppercase">Encrypted Treasures</p>
          </div>

          {/* Ship */}
          <div
            style={{
              width: 'clamp(280px, 30vw, 460px)',
              animation: 'shipFloat 7s ease-in-out infinite',
              filter: 'drop-shadow(0 0 44px rgba(62,207,190,0.55)) drop-shadow(0 30px 40px rgba(0,0,0,0.75))',
              transform: 'rotate(15deg)',
            }}
          >
            <img
              src="/assets/progctf-ship-removebg-preview.png"
              alt=""
              className="w-full h-auto pointer-events-none select-none"
            />
          </div>

          {/* CTAs */}
          <div className="flex gap-3 items-center">
            <button
              onClick={scrollToAbout}
              className="px-8 py-3 bg-teal text-navy-950 font-bold rounded hover:opacity-90 transition-opacity text-sm"
            >
              Learn More
            </button>
            <button
              onClick={scrollToAbout}
              aria-label="Scroll to about section"
              className="w-11 h-11 border border-navy-700/80 text-steel rounded hover:text-white hover:border-steel/60 transition-colors text-lg backdrop-blur-sm flex items-center justify-center"
            >
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes shipFloat {
            0%, 100% { transform: rotate(15deg) translateY(0px); }
            50%       { transform: rotate(15deg) translateY(-12px); }
          }
        `}</style>
      </div>

      {/* ── INFO SECTIONS ── */}
      <div style={{ background: '#010310' }}>

        <SectionDivider />

        {/* ABOUT */}
        <section id="about" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3ecfbe', marginBottom: '16px' }}>
              What is progctf?
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#fff', marginBottom: '20px', lineHeight: 1.15 }}>
              Plunder the depths.<br />Claim your bounty.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#8ab4e8', maxWidth: '680px' }}>
              progctf is a 48-hour pirate-themed jeopardy-style Capture the Flag competition. Navigate 7 challenge
              categories spanning web exploitation, cryptography, forensics, and more. Form a crew, solve challenges,
              earn points — and etch your name into the bounty board.
            </p>
            <div style={{ display: 'flex', gap: '40px', marginTop: '40px', flexWrap: 'wrap' }}>
              {([['30', 'Challenges'], ['7', 'Categories'], ['48h', 'Duration'], ['3', 'Difficulty tiers']] as const).map(([val, label]) => (
                <div key={label}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '11px', color: '#8ab4e8', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* CATEGORIES */}
        <section style={{ background: '#020820', padding: '80px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3ecfbe', marginBottom: '16px' }}>
              Challenge Categories
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Seven seas to conquer.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#8ab4e8', maxWidth: '680px', marginBottom: '40px' }}>
              Each category hides treasures at three depths — easy, medium, and hard. No crew has ever claimed them all.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {CATEGORIES.map(({ icon, name, subtitle, flavor }) => (
                <div
                  key={name}
                  style={{
                    background: '#071230',
                    border: '1px solid rgba(26,58,106,0.7)',
                    borderRadius: '6px',
                    padding: '20px 18px',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(62,207,190,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(26,58,106,0.7)')}
                >
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{name}</div>
                  <div style={{ fontSize: '11px', color: '#3ecfbe', marginBottom: '6px', letterSpacing: '0.05em' }}>{subtitle}</div>
                  <div style={{ fontSize: '12px', color: '#8ab4e8', lineHeight: 1.5 }}>{flavor}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* SPONSORS */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3ecfbe', marginBottom: '16px' }}>
              Sponsors
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Made possible by.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#8ab4e8', maxWidth: '680px', marginBottom: '40px' }}>
              progctf is supported by industry leaders who believe in growing the next generation of security professionals.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {['CrowdStrike', 'Sophos', 'Equifax'].map(name => (
                <div
                  key={name}
                  style={{
                    flex: '1 1 200px',
                    border: '1px solid rgba(26,58,106,0.7)',
                    borderRadius: '6px',
                    padding: '40px 24px',
                    background: '#071230',
                    textAlign: 'center',
                    color: '#8ab4e8',
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* SPONSORED CATEGORIES */}
        <section style={{ background: '#020820', padding: '80px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#3ecfbe', marginBottom: '16px' }}>
              Sponsored Categories
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
              Hunt for bigger bounties.
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.75, color: '#8ab4e8', maxWidth: '680px', marginBottom: '40px' }}>
              Select categories are sponsored by industry partners. Challenges in these categories are crafted around
              real tools, techniques, and scenarios from the sponsor's world — and the rewards reflect it. Solve a
              sponsored challenge, earn a larger prize.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {SPONSORED.map(({ sponsor, category, flavor }) => (
                <div
                  key={sponsor}
                  style={{
                    background: '#071230',
                    border: '1px solid rgba(62,207,190,0.3)',
                    borderRadius: '6px',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3ecfbe, rgba(62,207,190,0.2))' }} />
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', color: '#3ecfbe', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Sponsor
                  </p>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{sponsor}</div>
                  <div style={{ fontSize: '13px', color: '#8ab4e8', marginBottom: '16px' }}>
                    Sponsoring: <span style={{ color: '#fff' }}>{category}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#8ab4e8', lineHeight: 1.6 }}>{flavor}</div>
                  <div style={{ marginTop: '16px', fontSize: '11px', color: '#3ecfbe', fontWeight: 700 }}>★ Bonus prizes</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* FINAL CTA */}
        <div style={{ textAlign: 'center', padding: '80px 24px 100px', background: 'linear-gradient(180deg, #020820 0%, #010310 100%)' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>
            Ready to set sail?
          </h2>
          <p style={{ color: '#8ab4e8', fontSize: '14px', marginBottom: '32px' }}>Registration is free. Your crew is waiting.</p>
          <Link
            to="/register"
            className="px-10 py-3 bg-teal text-navy-950 font-bold rounded hover:opacity-90 transition-opacity text-sm inline-block"
          >
            Join the Hunt
          </Link>
        </div>

      </div>
    </>
  )
}
