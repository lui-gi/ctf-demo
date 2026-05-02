import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { strings } from '@/theme/strings';
import { chartsApi } from '@/api/charts';
import './Landing.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Cluster order is locked by the Helmsman brief. */
const CATEGORY_ORDER = [
  'cipher_cove',
  'cursed_ports',
  'shipwrights_forge',
  'lighthouse',
  'crows_nest',
  'hidden_cargo',
  'keymaster',
] as const;

type CategorySlug = (typeof CATEGORY_ORDER)[number];

/** 28x28 line glyphs — reused from the prior Landing.tsx implementation
 *  verbatim per the brief. Each is brass on the deep-sea card surface. */
function CategoryGlyph({ slug }: { slug: CategorySlug }): JSX.Element {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 28 28',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (slug) {
    case 'cursed_ports':
      return (
        <svg {...common}>
          <path d="M3 18h22" />
          <path d="M6 18v-9M11 18v-7M16 18v-9M21 18v-6" />
          <path d="M3 22q3-2 6 0t6 0t6 0t4 -1" />
        </svg>
      );
    case 'cipher_cove':
      return (
        <svg {...common}>
          <circle cx="9" cy="14" r="4" />
          <path d="M13 14h11M19 14v3M22 14v3" />
          <path d="M2 6q3-2 6 0t6 0t6 0t6 0" />
        </svg>
      );
    case 'shipwrights_forge':
      return (
        <svg {...common}>
          <path d="M5 9l8-3 4 4-3 8" />
          <path d="M14 10l5 5" />
          <path d="M3 22h22" />
          <path d="M7 22l3-5h8l3 5" />
        </svg>
      );
    case 'lighthouse':
      return (
        <svg {...common}>
          <path d="M11 22V9l3-4 3 4v13" />
          <path d="M11 13h6" />
          <path d="M9 22h10" />
          <path d="M3 7l5 2M25 7l-5 2M5 14h2M21 14h2" />
        </svg>
      );
    case 'crows_nest':
      return (
        <svg {...common}>
          <path d="M14 22V4" />
          <path d="M9 9h10" />
          <path d="M8 12h12" />
          <path d="M10 12v3h8v-3" />
          <circle cx="14" cy="6" r="1.5" />
        </svg>
      );
    case 'hidden_cargo':
      return (
        <svg {...common}>
          <path d="M4 7h20v15H4z" />
          <path d="M4 12h20M14 7v15" />
          <path d="M9 17l2 2 3-3" />
        </svg>
      );
    case 'keymaster':
      return (
        <svg {...common}>
          <circle cx="8" cy="14" r="4" />
          <path d="M12 14h12" />
          <path d="M18 14v4M22 14v3" />
          <path d="M8 12v4M6 14h4" />
        </svg>
      );
  }
}

/** Live Crew count via /api/charts. 401/empty/error → em-dash; never blocks. */
function useCrewCount(): string | number {
  const q = useQuery<{ rows?: unknown[]; crews?: unknown[] } | null>({
    queryKey: ['landing', 'charts-crew-count'],
    queryFn: async () => {
      try {
        const snap = (await chartsApi.snapshot()) as unknown as {
          rows?: unknown[];
          crews?: unknown[];
        };
        return snap;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  if (q.isLoading || !q.data) return strings.landing.metaUnknown;
  const list = q.data.crews ?? q.data.rows ?? [];
  if (!Array.isArray(list) || list.length === 0) {
    return strings.landing.metaUnknown;
  }
  return list.length;
}

/* ────────────────────────────────────────────────────────────────────
 *  Inline SVG scene — sunny + stormy layers stacked.
 *  Both stay mounted; GSAP cross-fades opacity and shifts transforms.
 *  All ship/sun/palm/dutchman art is hand-rolled paths. Zero raster.
 * ──────────────────────────────────────────────────────────────────── */

/** Wispy cloud — 3 stacked irregular paths at varying opacity for vapor depth.
 *  `tone` selects the color family; blur is applied via CSS class on the parent. */
function WispyCloud({
  cx,
  cy,
  scale = 1,
  tone = 'light',
}: {
  cx: number;
  cy: number;
  scale?: number;
  tone?: 'light' | 'dark';
}): JSX.Element {
  const fill = tone === 'light' ? '#ffffff' : '#0e1622';
  // Three layered irregular curves — back (largest, faintest) → mid → front
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <path
        d="M-180 10 C -160 -22 -120 -34 -80 -28 C -50 -44 -10 -42 20 -28 C 60 -40 110 -30 130 -8 C 160 -10 178 6 170 24 C 150 36 -160 40 -180 24 Z"
        fill={fill}
        fillOpacity={tone === 'light' ? 0.5 : 0.55}
      />
      <path
        d="M-140 4 C -118 -16 -82 -28 -52 -20 C -28 -34 6 -32 30 -18 C 62 -28 102 -20 116 -2 C 134 0 142 14 130 24 C 110 32 -128 32 -140 22 Z"
        fill={fill}
        fillOpacity={tone === 'light' ? 0.7 : 0.78}
      />
      <path
        d="M-100 -2 C -82 -16 -52 -22 -28 -16 C -8 -28 18 -24 38 -12 C 60 -18 92 -10 100 6 C 110 10 110 18 96 22 C 78 26 -90 24 -100 18 Z"
        fill={fill}
        fillOpacity={tone === 'light' ? 0.92 : 0.95}
      />
    </g>
  );
}

function HeroScene(): JSX.Element {
  return (
    <div className="hero-scene" aria-hidden>
      {/* SUNNY SKY — bright blue gradient + soft sun + light rays */}
      <div className="hero-scene__sky-sunny" data-scene="sky-sunny" />

      {/* STORMY SKY — heavy gradient overlay; opacity 0 by default */}
      <div className="hero-scene__sky-storm" data-scene="storm-sky" />

      {/* SUN — soft radial halo only, no hard disc. Feels like atmosphere,
          not a sticker. CSS handles the position + sizing. */}
      <div className="hero-scene__sun" data-scene="sun" aria-hidden />

      {/* GODRAYS — wide, soft volumetric light shafts angled out from the sun.
          Variable widths, low alpha, screen-blended. NOT line spokes. */}
      <svg
        className="hero-scene__rays"
        data-scene="rays"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="godrayA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff2c8" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#fff2c8" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#fff2c8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="godrayB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe6a8" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#ffe6a8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="godrayC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5d6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#fff5d6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Sun anchor near upper-right of viewBox */}
        <g className="hero-scene__rays-spin" transform="translate(940 90)">
          {/* Wide soft shaft — straight down-left */}
          <polygon points="-30,0 30,0 240,820 -240,820" fill="url(#godrayA)" />
          {/* Mid shaft — angled */}
          <polygon
            points="-18,0 18,0 130,820 -260,820"
            fill="url(#godrayB)"
            transform="rotate(-22)"
          />
          {/* Narrow sharper shaft */}
          <polygon
            points="-10,0 10,0 80,820 -160,820"
            fill="url(#godrayC)"
            transform="rotate(18)"
          />
          {/* Wider faint shaft far-left */}
          <polygon
            points="-22,0 22,0 220,820 -120,820"
            fill="url(#godrayB)"
            transform="rotate(-42)"
          />
          {/* Subtle sliver */}
          <polygon
            points="-6,0 6,0 50,820 -90,820"
            fill="url(#godrayC)"
            transform="rotate(-8)"
          />
        </g>
      </svg>

      {/* CLOUDS — wispy multi-layer SVG, blurred via CSS for vapor edges */}
      <svg
        className="hero-scene__clouds-sunny"
        data-scene="clouds-sunny"
        viewBox="0 0 1600 280"
        preserveAspectRatio="none"
      >
        <g>
          <WispyCloud cx={180} cy={130} scale={1.2} />
          <WispyCloud cx={460} cy={70} scale={0.9} />
          <WispyCloud cx={760} cy={150} scale={1.45} />
          <WispyCloud cx={1080} cy={90} scale={1.1} />
          <WispyCloud cx={1340} cy={160} scale={1.0} />
          <WispyCloud cx={1560} cy={80} scale={0.85} />
        </g>
      </svg>

      {/* STORM CLOUDS — irregular paths in storm tones, heavier blur via CSS */}
      <svg
        className="hero-scene__clouds-storm"
        data-scene="clouds-storm"
        viewBox="0 0 1600 320"
        preserveAspectRatio="none"
      >
        <g>
          <WispyCloud cx={160} cy={150} scale={1.7} tone="dark" />
          <WispyCloud cx={420} cy={100} scale={1.4} tone="dark" />
          <WispyCloud cx={720} cy={180} scale={2.0} tone="dark" />
          <WispyCloud cx={1040} cy={120} scale={1.6} tone="dark" />
          <WispyCloud cx={1360} cy={170} scale={1.8} tone="dark" />
          <WispyCloud cx={1580} cy={110} scale={1.5} tone="dark" />
        </g>
      </svg>

      {/* LIGHTNING FLICKER — rare, brief; opacity controlled by GSAP */}
      <div className="hero-scene__lightning" data-scene="lightning" />

      {/* SEA — three layered wave paths at staggered depths.
          Each layer animates horizontally at a different speed (parallax). */}
      <svg
        className="hero-scene__sea-sunny"
        data-scene="sea-sunny"
        viewBox="0 0 1600 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="seaSunnyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3aa3b8" stopOpacity="1" />
            <stop offset="55%" stopColor="#1f6d85" stopOpacity="1" />
            <stop offset="100%" stopColor="#0c3a4f" stopOpacity="1" />
          </linearGradient>
          {/* Horizon haze: dim cyan→navy mask softening sea-meets-sky */}
          <linearGradient id="seaSunnyHaze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5e2ec" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3aa3b8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="400" fill="url(#seaSunnyGrad)" />
        {/* Horizon haze band — top ~10% of sea */}
        <rect x="0" y="0" width="1600" height="60" fill="url(#seaSunnyHaze)" />
        {/* Distant wave layer — faint, tall, slowest parallax */}
        <path
          className="hero-scene__wave hero-scene__wave--far"
          d="M-100 70 Q 120 56 320 70 T 720 70 T 1120 70 T 1700 70 L 1700 110 L -100 110 Z"
          fill="#ffffff"
          fillOpacity="0.10"
        />
        {/* Mid wave layer */}
        <path
          className="hero-scene__wave hero-scene__wave--mid"
          d="M-100 160 Q 160 138 380 160 T 800 160 T 1220 160 T 1700 160 L 1700 210 L -100 210 Z"
          fill="#ffffff"
          fillOpacity="0.16"
        />
        {/* Foreground wave layer — darkest, deepest curves, fastest parallax */}
        <path
          className="hero-scene__wave hero-scene__wave--near"
          d="M-100 270 Q 200 244 420 270 T 880 270 T 1320 270 T 1700 270 L 1700 400 L -100 400 Z"
          fill="#0c3a4f"
          fillOpacity="0.55"
        />
        {/* Near wave highlight */}
        <path
          className="hero-scene__wave hero-scene__wave--near"
          d="M-100 310 Q 220 290 440 310 T 900 310 T 1340 310 T 1700 310"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1.4"
        />
      </svg>

      {/* STORM SEA — three layered dark wave paths + horizon haze */}
      <svg
        className="hero-scene__sea-storm"
        data-scene="sea-storm"
        viewBox="0 0 1600 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="seaStormGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1c2e" stopOpacity="1" />
            <stop offset="55%" stopColor="#06121e" stopOpacity="1" />
            <stop offset="100%" stopColor="#020608" stopOpacity="1" />
          </linearGradient>
          {/* Horizon haze for storm — soft navy bleed at the meeting line */}
          <linearGradient id="seaStormHaze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2a3d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0c1c2e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="400" fill="url(#seaStormGrad)" />
        <rect x="0" y="0" width="1600" height="55" fill="url(#seaStormHaze)" />
        {/* Distant churn — diffuse, slowest */}
        <path
          className="hero-scene__wave-storm hero-scene__wave-storm--far"
          d="M-100 70 Q 120 36 320 70 T 720 70 T 1120 70 T 1700 70 L 1700 130 L -100 130 Z"
          fill="#1a2a3d"
          fillOpacity="0.55"
        />
        {/* Mid storm wave */}
        <path
          className="hero-scene__wave-storm hero-scene__wave-storm--mid"
          d="M-100 170 Q 180 130 380 170 T 800 170 T 1220 170 T 1700 170 L 1700 230 L -100 230 Z"
          fill="#0c1c2e"
          fillOpacity="0.85"
        />
        {/* Foreground churn — darkest, fastest, jagged */}
        <path
          className="hero-scene__wave-storm hero-scene__wave-storm--near"
          d="M-100 280 Q 180 240 360 280 T 660 280 T 1000 270 T 1340 280 T 1700 280 L 1700 400 L -100 400 Z"
          fill="#020608"
          fillOpacity="0.95"
        />
        {/* Pale highlight ridge — near */}
        <path
          className="hero-scene__wave-storm hero-scene__wave-storm--near"
          d="M-100 320 Q 200 296 400 320 T 760 320 T 1140 320 T 1700 320"
          fill="none"
          stroke="#9aa8b3"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
      </svg>

      {/* BEACH STRIP — only visible in sunny state. The top edge is a wavy
          path; a CSS mask gradient (see Landing.css) further feathers the
          wet-sand-meets-sea boundary so it never reads as a straight cut. */}
      <svg
        className="hero-scene__beach"
        data-scene="beach"
        viewBox="0 0 1600 60"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c98a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#b89456" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Wavy top edge with subtle peaks/troughs — replaces the previous
            near-flat profile. Each segment varies amplitude so it feels
            natural, not a sine wave. */}
        <path
          d="M0 22 Q 120 6 260 18 Q 380 30 540 14 Q 680 4 820 20 Q 960 32 1100 16 Q 1240 6 1380 22 Q 1500 32 1600 18 L 1600 60 L 0 60 Z"
          fill="url(#sandGrad)"
        />
      </svg>

      {/* FOAM/SPRAY WISPS — small low-opacity white strands hugging the
          wet-sand line. They visually dissolve the beach into the sea. */}
      <svg
        className="hero-scene__beach-foam"
        data-scene="beach-foam"
        viewBox="0 0 1600 60"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g fill="none" stroke="#ffffff" strokeLinecap="round">
          <path d="M40 38 Q 120 30 200 38 T 360 36" strokeWidth="2" strokeOpacity="0.55" />
          <path d="M260 28 Q 340 22 420 28 T 580 26" strokeWidth="1.6" strokeOpacity="0.4" />
          <path d="M520 40 Q 620 34 720 40 T 900 38" strokeWidth="2" strokeOpacity="0.5" />
          <path d="M820 26 Q 900 20 980 26 T 1140 24" strokeWidth="1.5" strokeOpacity="0.38" />
          <path d="M1080 38 Q 1180 32 1280 38 T 1460 36" strokeWidth="2" strokeOpacity="0.5" />
          <path d="M1340 24 Q 1420 18 1500 24 T 1640 22" strokeWidth="1.4" strokeOpacity="0.36" />
        </g>
        {/* Tiny spray dots — dappled foam highlights */}
        <g fill="#ffffff" fillOpacity="0.45">
          <circle cx="120" cy="34" r="1.4" />
          <circle cx="320" cy="32" r="1" />
          <circle cx="540" cy="36" r="1.6" />
          <circle cx="780" cy="30" r="1.2" />
          <circle cx="1020" cy="34" r="1.5" />
          <circle cx="1280" cy="32" r="1.2" />
          <circle cx="1480" cy="34" r="1.4" />
        </g>
      </svg>

      {/* PALM SILHOUETTES — near-black tropical foliage in shade.
          Trunk is darker; fronds are tonal. A warm rim-light hints at
          the sun side, and a ground haze fades the bases into the beach. */}
      <svg
        className="hero-scene__palm hero-scene__palm--left"
        data-scene="palm-left"
        viewBox="0 0 200 320"
      >
        <defs>
          <linearGradient id="palmHazeL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c98a" stopOpacity="0" />
            <stop offset="100%" stopColor="#e6c98a" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* Trunk — near-black silhouette, slightly tapered */}
        <path
          d="M-2 322 Q 24 200 58 60"
          stroke="#050a10"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Fronds — broad blade silhouettes radiating from crown.
            Each frond is a closed shape with a wider belly than tip. */}
        <g fill="#070d18">
          {/* lower-left long frond */}
          <path d="M58 60 Q 10 70 -34 110 Q -10 86 14 76 Q 34 70 50 64 Q 56 62 58 60 Z" />
          {/* upper-left frond */}
          <path d="M58 60 Q 22 28 0 -8 Q 28 16 42 36 Q 52 50 56 56 Q 58 58 58 60 Z" />
          {/* upper-right frond — long arch */}
          <path d="M58 60 Q 96 28 144 4 Q 116 32 96 50 Q 80 60 66 64 Q 60 62 58 60 Z" />
          {/* mid-right horizontal frond */}
          <path d="M58 60 Q 124 56 188 78 Q 144 76 116 78 Q 88 78 70 70 Q 62 64 58 60 Z" />
          {/* lower-right droop */}
          <path d="M58 60 Q 96 100 130 156 Q 100 122 84 100 Q 70 80 60 64 Q 58 62 58 60 Z" />
          {/* lower-left droop */}
          <path d="M58 60 Q 28 100 -6 154 Q 18 120 36 96 Q 50 78 56 64 Q 58 62 58 60 Z" />
          {/* short crown frond — extra body at top */}
          <path d="M58 60 Q 64 30 78 4 Q 76 30 72 44 Q 66 56 60 60 Q 58 60 58 60 Z" />
        </g>
        {/* Frond mid-rib detail — slightly lighter, suggests texture */}
        <g stroke="#142030" strokeWidth="1" fill="none" strokeLinecap="round" strokeOpacity="0.6">
          <path d="M58 60 L -32 108" />
          <path d="M58 60 L 0 -6" />
          <path d="M58 60 L 142 4" />
          <path d="M58 60 L 186 78" />
          <path d="M58 60 L 128 154" />
          <path d="M58 60 L -4 152" />
        </g>
        {/* Faint warm rim-light on the sun side (right edge) */}
        <g stroke="#c9a24a" strokeOpacity="0.20" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M62 62 Q 100 30 142 6" />
          <path d="M62 62 Q 132 60 180 80" />
        </g>
        {/* Ground haze near base — fades trunk into beach */}
        <rect x="-30" y="220" width="220" height="100" fill="url(#palmHazeL)" />
      </svg>
      <svg
        className="hero-scene__palm hero-scene__palm--right"
        data-scene="palm-right"
        viewBox="0 0 200 320"
      >
        <defs>
          <linearGradient id="palmHazeR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c98a" stopOpacity="0" />
            <stop offset="100%" stopColor="#e6c98a" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path
          d="M202 322 Q 176 200 142 60"
          stroke="#050a10"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <g fill="#070d18">
          <path d="M142 60 Q 190 70 234 110 Q 210 86 186 76 Q 166 70 150 64 Q 144 62 142 60 Z" />
          <path d="M142 60 Q 178 28 200 -8 Q 172 16 158 36 Q 148 50 144 56 Q 142 58 142 60 Z" />
          <path d="M142 60 Q 104 28 56 4 Q 84 32 104 50 Q 120 60 134 64 Q 140 62 142 60 Z" />
          <path d="M142 60 Q 76 56 12 78 Q 56 76 84 78 Q 112 78 130 70 Q 138 64 142 60 Z" />
          <path d="M142 60 Q 104 100 70 156 Q 100 122 116 100 Q 130 80 140 64 Q 142 62 142 60 Z" />
          <path d="M142 60 Q 172 100 206 154 Q 182 120 164 96 Q 150 78 144 64 Q 142 62 142 60 Z" />
          <path d="M142 60 Q 136 30 122 4 Q 124 30 128 44 Q 134 56 140 60 Q 142 60 142 60 Z" />
        </g>
        <g stroke="#142030" strokeWidth="1" fill="none" strokeLinecap="round" strokeOpacity="0.6">
          <path d="M142 60 L 232 108" />
          <path d="M142 60 L 200 -6" />
          <path d="M142 60 L 58 4" />
          <path d="M142 60 L 14 78" />
          <path d="M142 60 L 72 154" />
          <path d="M142 60 L 204 152" />
        </g>
        {/* Rim-light on the sun side (left edge of right palm) */}
        <g stroke="#c9a24a" strokeOpacity="0.20" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M138 62 Q 100 30 58 6" />
          <path d="M138 62 Q 68 60 20 80" />
        </g>
        <rect x="-20" y="220" width="220" height="100" fill="url(#palmHazeR)" />
      </svg>

      {/* TREASURE CHEST — closed, lower-right of sunny scene.
          Tied to scroll: opacity 1 in sunny, fades to 0 in storm. */}
      <svg
        className="hero-scene__chest"
        data-scene="chest"
        viewBox="0 0 100 80"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="chestWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a4f28" />
            <stop offset="55%" stopColor="#5a371a" />
            <stop offset="100%" stopColor="#3a2310" />
          </linearGradient>
          <linearGradient id="chestLid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5a30" />
            <stop offset="100%" stopColor="#5a371a" />
          </linearGradient>
          <linearGradient id="chestBrass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c074" />
            <stop offset="100%" stopColor="#a07a30" />
          </linearGradient>
        </defs>
        {/* shadow under the chest */}
        <ellipse cx="50" cy="74" rx="36" ry="3.5" fill="#000" fillOpacity="0.3" />
        {/* chest body (lower box) */}
        <path
          d="M14 44 L 14 68 Q 14 72 18 72 L 82 72 Q 86 72 86 68 L 86 44 Z"
          fill="url(#chestWood)"
          stroke="#1d1208"
          strokeWidth="1.2"
        />
        {/* lid (closed, domed top) */}
        <path
          d="M14 44 Q 14 26 50 24 Q 86 26 86 44 Z"
          fill="url(#chestLid)"
          stroke="#1d1208"
          strokeWidth="1.2"
        />
        {/* lid wood-grain hint */}
        <path
          d="M22 38 Q 50 30 78 38"
          stroke="#3a2310"
          strokeOpacity="0.5"
          strokeWidth="0.8"
          fill="none"
        />
        {/* brass band — top of body */}
        <rect x="14" y="44" width="72" height="3.5" fill="url(#chestBrass)" stroke="#5a3e10" strokeWidth="0.4" />
        {/* brass band — middle of body */}
        <rect x="14" y="58" width="72" height="3.5" fill="url(#chestBrass)" stroke="#5a3e10" strokeWidth="0.4" />
        {/* brass corner caps — left + right */}
        <rect x="14" y="44" width="4" height="28" fill="url(#chestBrass)" stroke="#5a3e10" strokeWidth="0.4" />
        <rect x="82" y="44" width="4" height="28" fill="url(#chestBrass)" stroke="#5a3e10" strokeWidth="0.4" />
        {/* brass keyhole plate (front center) */}
        <rect x="44" y="50" width="12" height="14" rx="1.5" fill="url(#chestBrass)" stroke="#5a3e10" strokeWidth="0.5" />
        {/* keyhole */}
        <circle cx="50" cy="55" r="1.6" fill="#1d1208" />
        <path d="M50 55 L 50 60" stroke="#1d1208" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* DISTANT GALLEON — silhouetted vessel reading "far away" through
          atmospheric perspective: cooler/grayer fill, low overall opacity,
          three tonal layers (hull shadow / hull mid / sail light), thinner
          masts, no cartoon flag. A faint wake trails behind. */}
      <svg
        className="hero-scene__galleon"
        data-scene="galleon"
        viewBox="0 0 360 200"
      >
        {/* Faint wake — two thin lines fading behind the hull */}
        <g stroke="#cfe0e6" strokeOpacity="0.18" strokeLinecap="round" fill="none">
          <path d="M40 152 L 4 156" strokeWidth="0.9" />
          <path d="M44 158 L 12 162" strokeWidth="0.7" strokeOpacity="0.12" />
        </g>
        <g>
          {/* hull shadow (back layer, darkest) */}
          <path
            d="M62 144 Q 72 170 116 174 L 232 174 Q 276 170 286 144 Z"
            fill="#1c2a36"
          />
          {/* hull mid */}
          <path
            d="M68 138 Q 78 162 118 166 L 230 166 Q 270 162 280 138 Z"
            fill="#384955"
          />
          {/* gunwale + waterline shadow */}
          <path d="M68 138 L 280 138" stroke="#0c1620" strokeWidth="0.8" />
          {/* bowsprit — thin */}
          <path d="M280 138 L 308 126" stroke="#1c2a36" strokeWidth="1.6" strokeLinecap="round" />
          {/* masts — thin */}
          <path d="M174 138 L 174 28" stroke="#1c2a36" strokeWidth="1.4" />
          <path d="M114 138 L 114 50" stroke="#1c2a36" strokeWidth="1.2" />
          <path d="M232 138 L 232 60" stroke="#1c2a36" strokeWidth="1.2" />
          {/* yards */}
          <path d="M150 56 L 198 56" stroke="#1c2a36" strokeWidth="0.9" />
          <path d="M96 76 L 132 76" stroke="#1c2a36" strokeWidth="0.8" />
          <path d="M214 84 L 250 84" stroke="#1c2a36" strokeWidth="0.8" />
          {/* sails — desaturated cool cream, light layer */}
          <path
            d="M174 36 Q 158 56 152 100 Q 168 104 188 104 Q 200 104 200 100 Q 196 56 174 36 Z"
            fill="#d6dde2"
            fillOpacity="0.78"
          />
          <path
            d="M114 56 Q 102 70 98 102 Q 110 106 128 106 Q 138 106 138 102 Q 134 70 114 56 Z"
            fill="#c5cdd2"
            fillOpacity="0.72"
          />
          <path
            d="M232 64 Q 222 78 218 108 Q 230 112 246 112 Q 256 112 256 108 Q 252 78 232 64 Z"
            fill="#c5cdd2"
            fillOpacity="0.72"
          />
          {/* small triangular pennant silhouette — no red, just dark */}
          <path d="M174 28 L 188 32 L 174 36 Z" fill="#1c2a36" />
        </g>
      </svg>

      {/* DUTCHMAN SILHOUETTE — flat dark shape only, on horizon center.
          No green hull, no glow, no aura. Opacity ramps in with storm. */}
      <svg
        className="hero-scene__dutchman"
        data-scene="dutchman"
        viewBox="0 0 380 240"
      >
        <g fill="#03070d" stroke="#03070d" strokeWidth="1">
          {/* hull silhouette */}
          <path d="M40 150 Q 52 196 110 200 L 270 200 Q 328 196 340 150 L 320 156 L 60 156 Z" />
          {/* bowsprit */}
          <path
            d="M340 150 L 374 132"
            stroke="#03070d"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* masts */}
          <path d="M190 150 L 190 18" stroke="#03070d" strokeWidth="3" />
          <path d="M120 150 L 120 38" stroke="#03070d" strokeWidth="2.6" />
          <path d="M260 150 L 260 50" stroke="#03070d" strokeWidth="2.6" />
          {/* yardarms */}
          <path d="M150 56 L 230 56" stroke="#03070d" strokeWidth="1.6" />
          <path d="M88 70 L 152 70" stroke="#03070d" strokeWidth="1.4" />
          <path d="M228 78 L 292 78" stroke="#03070d" strokeWidth="1.4" />
          {/* sails — flat silhouette fills */}
          <path d="M152 60 L 228 60 L 232 116 Q 220 122 200 120 L 196 110 L 188 122 L 178 110 L 168 124 L 156 110 Z" />
          <path d="M90 74 L 150 74 L 152 120 Q 140 124 122 122 L 118 112 L 110 124 L 102 112 L 94 124 Z" />
          <path d="M230 82 L 290 82 L 292 126 Q 280 130 264 128 L 260 118 L 252 130 L 244 118 L 236 130 Z" />
          {/* small flag */}
          <path d="M190 18 L 212 24 L 190 30 Z" />
        </g>
      </svg>

      {/* VIGNETTE — soft inner shadow on the whole scene */}
      <div className="hero-scene__vignette" aria-hidden />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  Sail-across Dutchman scene — full-bleed band below the categories.
 *  Triggered ONCE on viewport entry. After the ship exits, ambient
 *  lightning flickers continue forever.
 * ──────────────────────────────────────────────────────────────────── */
function DutchmanBand(): JSX.Element {
  return (
    <div className="dutchman-band" aria-hidden>
      <div className="dutchman-band__sky" />
      {/* layered storm clouds */}
      <svg
        className="dutchman-band__clouds"
        viewBox="0 0 1600 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bandClouds" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1f2a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0a0d14" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <g fill="url(#bandClouds)">
          <ellipse cx="200" cy="80" rx="240" ry="46" />
          <ellipse cx="540" cy="60" rx="200" ry="40" />
          <ellipse cx="900" cy="92" rx="240" ry="50" />
          <ellipse cx="1280" cy="68" rx="220" ry="44" />
        </g>
      </svg>
      {/* sea — single slab */}
      <svg
        className="dutchman-band__sea"
        viewBox="0 0 1600 240"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bandSea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1c2e" />
            <stop offset="55%" stopColor="#06121e" />
            <stop offset="100%" stopColor="#020608" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="240" fill="url(#bandSea)" />
        <g stroke="#9aa8b3" strokeOpacity="0.22" strokeWidth="1.2" fill="none">
          <path d="M-40 60 Q 200 30 400 60 T 800 60 T 1640 60" />
          <path d="M-40 140 Q 240 110 440 140 T 840 140 T 1640 140" />
          <path d="M-40 210 Q 220 180 420 210 T 820 210 T 1640 210" />
        </g>
      </svg>

      {/* lightning flash — continues after ship exits */}
      <div className="dutchman-band__lightning" data-band="lightning" />

      {/* ship-pair group — tweened across by GSAP */}
      <div className="dutchman-band__ship-wrap" data-band="ship-wrap">
        {/* green companion silhouette behind */}
        <svg
          className="dutchman-band__companion"
          viewBox="0 0 280 180"
        >
          <g opacity="0.7">
            <path
              d="M30 120 Q 40 150 80 154 L 200 154 Q 240 150 250 120 Z"
              fill="#0d2a18"
              stroke="#1f5232"
              strokeWidth="1.4"
            />
            <path d="M140 120 L 140 28" stroke="#1f5232" strokeWidth="2.4" />
            <path d="M88 120 L 88 44" stroke="#1f5232" strokeWidth="2" />
            <path d="M196 120 L 196 50" stroke="#1f5232" strokeWidth="2" />
            <path
              d="M140 34 Q 122 56 116 92 Q 138 96 162 96 Q 174 96 174 90 Q 168 56 140 34 Z"
              fill="#1d4a2c"
            />
            <path
              d="M88 50 Q 76 64 72 96 Q 86 100 104 100 Q 114 100 114 96 Q 110 66 88 50 Z"
              fill="#1d4a2c"
            />
            <path
              d="M196 56 Q 186 70 182 102 Q 196 106 212 106 Q 222 106 222 102 Q 218 72 196 56 Z"
              fill="#1d4a2c"
            />
          </g>
        </svg>

        {/* full spectral Dutchman — green hull, glowing aura, tattered sails */}
        <svg
          className="dutchman-band__dutchman"
          viewBox="0 0 380 240"
        >
          <defs>
            <radialGradient id="bandDutchAura" cx="50%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#5fff9a" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#3aa05a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0a3a1a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bandDutchHull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f5232" />
              <stop offset="100%" stopColor="#062612" />
            </linearGradient>
            <linearGradient id="bandDutchSail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a8a52" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#0d2a18" stopOpacity="0.6" />
            </linearGradient>
            <filter id="bandDutchGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <ellipse
            cx="190"
            cy="150"
            rx="200"
            ry="80"
            fill="url(#bandDutchAura)"
            className="dutchman-band__aura"
          />
          <ellipse
            cx="190"
            cy="140"
            rx="170"
            ry="60"
            fill="#5fff9a"
            fillOpacity="0.06"
            filter="url(#bandDutchGlow)"
          />
          <g>
            <path
              d="M40 150 Q 52 196 110 200 L 270 200 Q 328 196 340 150 L 320 156 L 60 156 Z"
              fill="url(#bandDutchHull)"
              stroke="#5fff9a"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />
            <path
              d="M70 168 L 80 188 M 130 162 L 138 186 M 220 164 L 226 188 M 290 166 L 298 186"
              stroke="#5fff9a"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
            <path
              d="M340 150 L 374 132"
              stroke="#1f5232"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M190 150 L 190 18" stroke="#1f5232" strokeWidth="3" />
            <path d="M120 150 L 120 38" stroke="#1f5232" strokeWidth="2.6" />
            <path d="M260 150 L 260 50" stroke="#1f5232" strokeWidth="2.6" />
            <path d="M150 56 L 230 56" stroke="#1f5232" strokeWidth="1.6" />
            <path d="M88 70 L 152 70" stroke="#1f5232" strokeWidth="1.4" />
            <path d="M228 78 L 292 78" stroke="#1f5232" strokeWidth="1.4" />
            <path
              d="M152 60 L 228 60 L 232 116 Q 220 122 200 120 L 196 110 L 188 122 L 178 110 L 168 124 L 156 110 Z"
              fill="url(#bandDutchSail)"
              stroke="#5fff9a"
              strokeOpacity="0.35"
              strokeWidth="0.8"
            />
            <path
              d="M90 74 L 150 74 L 152 120 Q 140 124 122 122 L 118 112 L 110 124 L 102 112 L 94 124 Z"
              fill="url(#bandDutchSail)"
              stroke="#5fff9a"
              strokeOpacity="0.32"
              strokeWidth="0.8"
            />
            <path
              d="M230 82 L 290 82 L 292 126 Q 280 130 264 128 L 260 118 L 252 130 L 244 118 L 236 130 Z"
              fill="url(#bandDutchSail)"
              stroke="#5fff9a"
              strokeOpacity="0.32"
              strokeWidth="0.8"
            />
            <path d="M190 18 L 212 24 L 190 30 Z" fill="#5fff9a" fillOpacity="0.55" />
            <circle cx="320" cy="150" r="2.5" fill="#a4ffc4" opacity="0.9" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  Static fallback for prefers-reduced-motion + mobile.
 *  Same composition as the full scene, but only the storm state.
 * ──────────────────────────────────────────────────────────────────── */
function HeroSceneStatic(): JSX.Element {
  return (
    <div className="hero-scene hero-scene--static" aria-hidden>
      <div className="hero-scene__sky-storm hero-scene__sky-storm--static" />
      {/* Wispy storm clouds — same multi-layer technique as the dynamic variant */}
      <svg
        className="hero-scene__clouds-storm hero-scene__clouds-storm--static"
        viewBox="0 0 1600 320"
        preserveAspectRatio="none"
      >
        <g>
          <WispyCloud cx={160} cy={150} scale={1.7} tone="dark" />
          <WispyCloud cx={420} cy={100} scale={1.4} tone="dark" />
          <WispyCloud cx={720} cy={180} scale={2.0} tone="dark" />
          <WispyCloud cx={1040} cy={120} scale={1.6} tone="dark" />
          <WispyCloud cx={1360} cy={170} scale={1.8} tone="dark" />
          <WispyCloud cx={1580} cy={110} scale={1.5} tone="dark" />
        </g>
      </svg>
      {/* Multi-layer storm sea + horizon haze (static, no parallax) */}
      <svg
        className="hero-scene__sea-storm hero-scene__sea-storm--static"
        viewBox="0 0 1600 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="seaStormStaticGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1c2e" />
            <stop offset="55%" stopColor="#06121e" />
            <stop offset="100%" stopColor="#020608" />
          </linearGradient>
          <linearGradient id="seaStormStaticHaze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2a3d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0c1c2e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="400" fill="url(#seaStormStaticGrad)" />
        <rect x="0" y="0" width="1600" height="55" fill="url(#seaStormStaticHaze)" />
        <path
          d="M-100 70 Q 120 36 320 70 T 720 70 T 1120 70 T 1700 70 L 1700 130 L -100 130 Z"
          fill="#1a2a3d"
          fillOpacity="0.55"
        />
        <path
          d="M-100 170 Q 180 130 380 170 T 800 170 T 1220 170 T 1700 170 L 1700 230 L -100 230 Z"
          fill="#0c1c2e"
          fillOpacity="0.85"
        />
        <path
          d="M-100 280 Q 180 240 360 280 T 660 280 T 1000 270 T 1340 280 T 1700 280 L 1700 400 L -100 400 Z"
          fill="#020608"
          fillOpacity="0.95"
        />
        <path
          d="M-100 320 Q 200 296 400 320 T 760 320 T 1140 320 T 1700 320"
          fill="none"
          stroke="#9aa8b3"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
      </svg>

      {/* Palm silhouettes — dark fronds against the storm sky.
          Static variant: no rim-light (sun is gone), still has ground haze. */}
      <svg
        className="hero-scene__palm hero-scene__palm--left hero-scene__palm--static"
        viewBox="0 0 200 320"
      >
        <defs>
          <linearGradient id="palmHazeLStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1c2e" stopOpacity="0" />
            <stop offset="100%" stopColor="#0c1c2e" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          d="M-2 322 Q 24 200 58 60"
          stroke="#04080d"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <g fill="#04080d">
          <path d="M58 60 Q 10 70 -34 110 Q -10 86 14 76 Q 34 70 50 64 Q 56 62 58 60 Z" />
          <path d="M58 60 Q 22 28 0 -8 Q 28 16 42 36 Q 52 50 56 56 Q 58 58 58 60 Z" />
          <path d="M58 60 Q 96 28 144 4 Q 116 32 96 50 Q 80 60 66 64 Q 60 62 58 60 Z" />
          <path d="M58 60 Q 124 56 188 78 Q 144 76 116 78 Q 88 78 70 70 Q 62 64 58 60 Z" />
          <path d="M58 60 Q 96 100 130 156 Q 100 122 84 100 Q 70 80 60 64 Q 58 62 58 60 Z" />
          <path d="M58 60 Q 28 100 -6 154 Q 18 120 36 96 Q 50 78 56 64 Q 58 62 58 60 Z" />
          <path d="M58 60 Q 64 30 78 4 Q 76 30 72 44 Q 66 56 60 60 Q 58 60 58 60 Z" />
        </g>
        <rect x="-30" y="220" width="220" height="100" fill="url(#palmHazeLStatic)" />
      </svg>
      <svg
        className="hero-scene__palm hero-scene__palm--right hero-scene__palm--static"
        viewBox="0 0 200 320"
      >
        <defs>
          <linearGradient id="palmHazeRStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1c2e" stopOpacity="0" />
            <stop offset="100%" stopColor="#0c1c2e" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <path
          d="M202 322 Q 176 200 142 60"
          stroke="#04080d"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <g fill="#04080d">
          <path d="M142 60 Q 190 70 234 110 Q 210 86 186 76 Q 166 70 150 64 Q 144 62 142 60 Z" />
          <path d="M142 60 Q 178 28 200 -8 Q 172 16 158 36 Q 148 50 144 56 Q 142 58 142 60 Z" />
          <path d="M142 60 Q 104 28 56 4 Q 84 32 104 50 Q 120 60 134 64 Q 140 62 142 60 Z" />
          <path d="M142 60 Q 76 56 12 78 Q 56 76 84 78 Q 112 78 130 70 Q 138 64 142 60 Z" />
          <path d="M142 60 Q 104 100 70 156 Q 100 122 116 100 Q 130 80 140 64 Q 142 62 142 60 Z" />
          <path d="M142 60 Q 172 100 206 154 Q 182 120 164 96 Q 150 78 144 64 Q 142 62 142 60 Z" />
          <path d="M142 60 Q 136 30 122 4 Q 124 30 128 44 Q 134 56 140 60 Q 142 60 142 60 Z" />
        </g>
        <rect x="-20" y="220" width="220" height="100" fill="url(#palmHazeRStatic)" />
      </svg>

      {/* dutchman silhouette — flat dark shape, matches in-hero downgrade */}
      <svg
        className="hero-scene__dutchman hero-scene__dutchman--static"
        viewBox="0 0 380 240"
      >
        <g fill="#03070d" stroke="#03070d" strokeWidth="1">
          <path d="M40 150 Q 52 196 110 200 L 270 200 Q 328 196 340 150 L 320 156 L 60 156 Z" />
          <path
            d="M340 150 L 374 132"
            stroke="#03070d"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M190 150 L 190 18" stroke="#03070d" strokeWidth="3" />
          <path d="M120 150 L 120 38" stroke="#03070d" strokeWidth="2.6" />
          <path d="M260 150 L 260 50" stroke="#03070d" strokeWidth="2.6" />
          <path d="M150 56 L 230 56" stroke="#03070d" strokeWidth="1.6" />
          <path d="M88 70 L 152 70" stroke="#03070d" strokeWidth="1.4" />
          <path d="M228 78 L 292 78" stroke="#03070d" strokeWidth="1.4" />
          <path d="M152 60 L 228 60 L 232 116 Q 220 122 200 120 L 196 110 L 188 122 L 178 110 L 168 124 L 156 110 Z" />
          <path d="M90 74 L 150 74 L 152 120 Q 140 124 122 122 L 118 112 L 110 124 L 102 112 L 94 124 Z" />
          <path d="M230 82 L 290 82 L 292 126 Q 280 130 264 128 L 260 118 L 252 130 L 244 118 L 236 130 Z" />
          <path d="M190 18 L 212 24 L 190 30 Z" />
        </g>
      </svg>

      {/* faded chest — static, lower-right (mobile compensation) */}
      <svg
        className="hero-scene__chest hero-scene__chest--static"
        viewBox="0 0 100 80"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="chestWoodStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a4f28" />
            <stop offset="55%" stopColor="#5a371a" />
            <stop offset="100%" stopColor="#3a2310" />
          </linearGradient>
          <linearGradient id="chestLidStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5a30" />
            <stop offset="100%" stopColor="#5a371a" />
          </linearGradient>
          <linearGradient id="chestBrassStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6c074" />
            <stop offset="100%" stopColor="#a07a30" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="74" rx="36" ry="3.5" fill="#000" fillOpacity="0.3" />
        <path
          d="M14 44 L 14 68 Q 14 72 18 72 L 82 72 Q 86 72 86 68 L 86 44 Z"
          fill="url(#chestWoodStatic)"
          stroke="#1d1208"
          strokeWidth="1.2"
        />
        <path
          d="M14 44 Q 14 26 50 24 Q 86 26 86 44 Z"
          fill="url(#chestLidStatic)"
          stroke="#1d1208"
          strokeWidth="1.2"
        />
        <rect x="14" y="44" width="72" height="3.5" fill="url(#chestBrassStatic)" stroke="#5a3e10" strokeWidth="0.4" />
        <rect x="14" y="58" width="72" height="3.5" fill="url(#chestBrassStatic)" stroke="#5a3e10" strokeWidth="0.4" />
        <rect x="14" y="44" width="4" height="28" fill="url(#chestBrassStatic)" stroke="#5a3e10" strokeWidth="0.4" />
        <rect x="82" y="44" width="4" height="28" fill="url(#chestBrassStatic)" stroke="#5a3e10" strokeWidth="0.4" />
        <rect x="44" y="50" width="12" height="14" rx="1.5" fill="url(#chestBrassStatic)" stroke="#5a3e10" strokeWidth="0.5" />
        <circle cx="50" cy="55" r="1.6" fill="#1d1208" />
        <path d="M50 55 L 50 60" stroke="#1d1208" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      <div className="hero-scene__vignette" />
    </div>
  );
}

/* Static fallback for the new sail-across band: parked silhouette + aura,
 * no crossing motion. Used for prefers-reduced-motion and mobile. */
function DutchmanBandStatic(): JSX.Element {
  return (
    <div className="dutchman-band dutchman-band--static" aria-hidden>
      <div className="dutchman-band__sky" />
      <svg
        className="dutchman-band__sea"
        viewBox="0 0 1600 240"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="bandSeaStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c1c2e" />
            <stop offset="55%" stopColor="#06121e" />
            <stop offset="100%" stopColor="#020608" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1600" height="240" fill="url(#bandSeaStatic)" />
        <g stroke="#9aa8b3" strokeOpacity="0.22" strokeWidth="1.2" fill="none">
          <path d="M-40 60 Q 200 30 400 60 T 800 60 T 1640 60" />
          <path d="M-40 140 Q 240 110 440 140 T 840 140 T 1640 140" />
          <path d="M-40 210 Q 220 180 420 210 T 820 210 T 1640 210" />
        </g>
      </svg>
      {/* parked spectral Dutchman center-horizon, with green aura */}
      <svg
        className="dutchman-band__dutchman dutchman-band__dutchman--static"
        viewBox="0 0 380 240"
      >
        <defs>
          <radialGradient id="bandDutchAuraStatic" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stopColor="#5fff9a" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#3aa05a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0a3a1a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bandDutchHullStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f5232" />
            <stop offset="100%" stopColor="#062612" />
          </linearGradient>
          <linearGradient id="bandDutchSailStatic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a8a52" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0d2a18" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <ellipse cx="190" cy="150" rx="200" ry="80" fill="url(#bandDutchAuraStatic)" />
        <g>
          <path
            d="M40 150 Q 52 196 110 200 L 270 200 Q 328 196 340 150 L 320 156 L 60 156 Z"
            fill="url(#bandDutchHullStatic)"
            stroke="#5fff9a"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />
          <path
            d="M340 150 L 374 132"
            stroke="#1f5232"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M190 150 L 190 18" stroke="#1f5232" strokeWidth="3" />
          <path d="M120 150 L 120 38" stroke="#1f5232" strokeWidth="2.6" />
          <path d="M260 150 L 260 50" stroke="#1f5232" strokeWidth="2.6" />
          <path d="M150 56 L 230 56" stroke="#1f5232" strokeWidth="1.6" />
          <path
            d="M152 60 L 228 60 L 232 116 Q 220 122 200 120 L 196 110 L 188 122 L 178 110 L 168 124 L 156 110 Z"
            fill="url(#bandDutchSailStatic)"
          />
          <path
            d="M90 74 L 150 74 L 152 120 Q 140 124 122 122 L 118 112 L 110 124 L 102 112 L 94 124 Z"
            fill="url(#bandDutchSailStatic)"
          />
          <path
            d="M230 82 L 290 82 L 292 126 Q 280 130 264 128 L 260 118 L 252 130 L 244 118 L 236 130 Z"
            fill="url(#bandDutchSailStatic)"
          />
          <path d="M190 18 L 212 24 L 190 30 Z" fill="#5fff9a" fillOpacity="0.55" />
        </g>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  Landing component — assembles scene + content + categories + motto
 *  and wires all motion via gsap.matchMedia for responsive gating.
 * ──────────────────────────────────────────────────────────────────── */
export function Landing(): JSX.Element {
  const crewCount = useCrewCount();
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!rootRef.current) return;

      const mm = gsap.matchMedia();

      // ── Reduced motion: skip every animation; rely on the persistent
      // backdrop for the post-sunny atmosphere. Hide the sunny hero AND
      // the legacy in-hero storm overlays — the backdrop handles it. ──
      mm.add('(prefers-reduced-motion: reduce)', () => {
        const root = rootRef.current!;
        gsap.set(root.querySelectorAll('[data-scene="sun"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="rays"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="clouds-sunny"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="sea-sunny"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="beach"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="beach-foam"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="sky-sunny"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="galleon"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="chest"]'), { opacity: 0 });
        // Legacy storm overlays — kept in DOM, forced invisible.
        gsap.set(root.querySelectorAll('[data-scene="storm-sky"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="clouds-storm"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="sea-storm"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="dutchman"]'), { opacity: 0 });
        // Center the backdrop Dutchman + aura even when no animations run.
        gsap.set(root.querySelectorAll('[data-backdrop="dutchman"]'), { xPercent: -50 });
        gsap.set(root.querySelectorAll('[data-backdrop="aura"]'), { xPercent: -50 });
      });

      // ── Mobile (≤768px): single static composition; rely on backdrop ──
      mm.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const root = rootRef.current!;
        gsap.set(root.querySelectorAll('[data-scene="sun"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="rays"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="clouds-sunny"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="sea-sunny"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="beach"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="beach-foam"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="sky-sunny"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="galleon"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="chest"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="storm-sky"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="clouds-storm"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="sea-storm"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="dutchman"]'), { opacity: 0 });
        // Center the backdrop Dutchman + aura on mobile too.
        gsap.set(root.querySelectorAll('[data-backdrop="dutchman"]'), { xPercent: -50 });
        gsap.set(root.querySelectorAll('[data-backdrop="aura"]'), { xPercent: -50 });
      });

      // ── Desktop (>768px) + motion-OK: full scroll-driven cinematic ──
      mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
        const root = rootRef.current!;
        const heroEl = root.querySelector<HTMLElement>('.landing__hero');
        if (!heroEl) return;

        // ── Initial state — bright sunny day ──
        gsap.set(root.querySelectorAll('[data-scene="storm-sky"]'), { opacity: 0 });
        gsap.set(root.querySelectorAll('[data-scene="clouds-storm"]'), {
          opacity: 0,
        });
        gsap.set(root.querySelectorAll('[data-scene="sea-storm"]'), { opacity: 0 });
        // Dutchman silhouette starts invisible; ramps to ~0.5 by full storm.
        gsap.set(root.querySelectorAll('[data-scene="dutchman"]'), {
          opacity: 0,
        });
        gsap.set(root.querySelectorAll('[data-scene="chest"]'), { opacity: 1 });
        gsap.set(root.querySelectorAll('[data-scene="lightning"]'), { opacity: 0 });

        /* ── Ambient (non-scrubbed) loops ─────────────────────────────
         * Use gsap.ticker (RAF-driven) — never setInterval. Animate only
         * transform / opacity. Each runs forever; killed with the context. */

        // Galleon drifts ~120s per pass (very slow — ambient, not marquee).
        gsap.fromTo(
          root.querySelectorAll('[data-scene="galleon"]'),
          { xPercent: -110 },
          {
            xPercent: 110,
            duration: 120,
            ease: 'none',
            repeat: -1,
          },
        );
        // Subtle bob on the galleon
        gsap.to(root.querySelectorAll('[data-scene="galleon"]'), {
          y: '+=6',
          duration: 4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        // Sunny clouds drift right (~80s/pass)
        gsap.fromTo(
          root.querySelectorAll('[data-scene="clouds-sunny"]'),
          { xPercent: -8 },
          {
            xPercent: 8,
            duration: 80,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          },
        );

        // Storm clouds drift left, slightly faster + heavier
        gsap.fromTo(
          root.querySelectorAll('[data-scene="clouds-storm"]'),
          { xPercent: 6 },
          {
            xPercent: -6,
            duration: 50,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          },
        );

        // Godrays — very slow, subtle drift in angle (atmosphere, not spin)
        const raysSpin = root.querySelector<SVGGElement>(
          '.hero-scene__rays-spin',
        );
        if (raysSpin) {
          gsap.fromTo(
            raysSpin,
            { rotate: -3 },
            {
              rotate: 3,
              duration: 26,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
              transformOrigin: '50% 0%',
            },
          );
        }

        // Multi-layer wave parallax — each layer drifts at a different speed.
        // Foreground = fastest, distant = slowest. Animate transform only.
        gsap.to(root.querySelectorAll('.hero-scene__wave--far'), {
          x: 16,
          duration: 11,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(root.querySelectorAll('.hero-scene__wave--mid'), {
          x: 30,
          duration: 7.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(root.querySelectorAll('.hero-scene__wave--near'), {
          x: 56,
          duration: 4.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        // Storm waves — same layered parallax with bigger amplitude
        gsap.to(root.querySelectorAll('.hero-scene__wave-storm--far'), {
          x: 22,
          duration: 9,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(root.querySelectorAll('.hero-scene__wave-storm--mid'), {
          x: 48,
          duration: 5.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(root.querySelectorAll('.hero-scene__wave-storm--near'), {
          x: 84,
          duration: 3.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        // Palms — gentle sway in sunny, scroll bumps amplitude in storm
        const palmLeft = root.querySelector<SVGElement>(
          '[data-scene="palm-left"]',
        );
        const palmRight = root.querySelector<SVGElement>(
          '[data-scene="palm-right"]',
        );
        if (palmLeft) {
          gsap.set(palmLeft, { transformOrigin: '0% 100%' });
          gsap.to(palmLeft, {
            rotate: 3,
            duration: 5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }
        if (palmRight) {
          gsap.set(palmRight, { transformOrigin: '100% 100%' });
          gsap.to(palmRight, {
            rotate: -3,
            duration: 5.4,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }

        // The in-hero Dutchman is a flat silhouette now — no aura pulse, no
        // bob. It's atmospheric, not a focal hero. Opacity is the only
        // expressive channel and it's driven by scroll progress.

        /* ── Persistent backdrop animations ────────────────────────────
         * Rain falls in two layered passes (different speeds for parallax).
         * Spectral Dutchman drifts L↔R with a slow bob and aura pulse. */

        // Rain — translateY only. Two layers, different periods, transform-only.
        const rainBack = root.querySelector<HTMLElement>('[data-backdrop="rain-back"]');
        const rainFront = root.querySelector<HTMLElement>('[data-backdrop="rain-front"]');
        if (rainBack) {
          gsap.to(rainBack, {
            backgroundPosition: '0 1600px',
            duration: 6.5,
            ease: 'none',
            repeat: -1,
          });
        }
        if (rainFront) {
          gsap.to(rainFront, {
            backgroundPosition: '0 1200px',
            duration: 3.8,
            ease: 'none',
            repeat: -1,
          });
        }

        // Spectral Dutchman — centered (xPercent -50) with slow horizontal
        // drift (small amplitude) and idle vertical bob, so it stays mid-
        // horizon and visibly alive per the brief.
        const bdDutchman = root.querySelector<SVGElement>('[data-backdrop="dutchman"]');
        if (bdDutchman) {
          // Anchor center via xPercent so subsequent x/y tweens compose cleanly
          gsap.set(bdDutchman, { xPercent: -50 });
          // Slow horizontal drift — yoyo back to center
          gsap.to(bdDutchman, {
            x: 24,
            duration: 14,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
          // Idle vertical bob
          gsap.to(bdDutchman, {
            y: 8,
            duration: 4.2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }
        // Aura pulse — center with xPercent and pulse opacity
        const bdAura = root.querySelector<HTMLElement>('[data-backdrop="aura"]');
        if (bdAura) {
          gsap.set(bdAura, { xPercent: -50 });
          gsap.to(bdAura, {
            opacity: 0.55,
            duration: 3.6,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }
        // Trails — each fades+drifts independently for the "wisp wake" feel
        const trails = root.querySelectorAll<HTMLElement>('[data-backdrop="trail"]');
        trails.forEach((t, i) => {
          gsap.to(t, {
            opacity: '-=0.18',
            x: -28 - i * 6,
            duration: 3.2 + i * 0.4,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: i * 0.4,
          });
        });

        // ── Lightning flicker — RARE, brief, atmospheric ──
        // Schedule the next flicker between 8-15s with a 2-frame flash, then
        // a quick after-flash. Never setInterval.
        const lightning = root.querySelector<HTMLElement>(
          '[data-scene="lightning"]',
        );
        let lightningHandle: gsap.core.Tween | null = null;
        const scheduleLightning = (): void => {
          const wait = 8 + Math.random() * 7; // 8..15s
          lightningHandle = gsap.to({}, {
            duration: wait,
            onComplete: () => {
              if (!lightning) return;
              const tl = gsap.timeline({ onComplete: scheduleLightning });
              tl.to(lightning, { opacity: 0.55, duration: 0.06 })
                .to(lightning, { opacity: 0, duration: 0.08 })
                .to(lightning, { opacity: 0.35, duration: 0.05 }, '+=0.05')
                .to(lightning, { opacity: 0, duration: 0.4, ease: 'power2.out' });
            },
          });
        };
        scheduleLightning();

        // ── Scroll-driven master timeline (no pin — hero scrolls naturally) ──
        // Sunny→storm transition scrubs while the hero exits the viewport.
        // By the time bottom of hero hits top of viewport, the storm composition
        // is fully painted and the hero has scrolled out of frame.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroEl,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });

        // 0 → 1 along the timeline maps to scroll progress. The persistent
        // dark/rain/Dutchman backdrop sits BEHIND the hero, so we just need
        // to fade out the sunny layers — the backdrop is revealed naturally.
        // The legacy in-hero storm overlays (storm-sky, clouds-storm, sea-
        // storm, in-hero dutchman silhouette) are NOT faded in; they stay
        // at opacity 0 so the persistent layer drives the post-sunny visual.
        tl.to(
          root.querySelectorAll('[data-scene="sky-sunny"]'),
          { opacity: 0, ease: 'none' },
          0,
        )
          .to(
            root.querySelectorAll('[data-scene="sun"]'),
            { opacity: 0, scale: 0.85, ease: 'none' },
            0,
          )
          .to(
            root.querySelectorAll('[data-scene="rays"]'),
            { opacity: 0, ease: 'none' },
            0,
          )
          .to(
            root.querySelectorAll('[data-scene="clouds-sunny"]'),
            { opacity: 0, ease: 'none' },
            0,
          )
          .to(
            root.querySelectorAll('[data-scene="sea-sunny"]'),
            { opacity: 0, ease: 'none' },
            0.1,
          )
          .to(
            root.querySelectorAll('[data-scene="beach"]'),
            { opacity: 0, ease: 'none' },
            0.2,
          )
          .to(
            root.querySelectorAll('[data-scene="beach-foam"]'),
            { opacity: 0, ease: 'none' },
            0.2,
          )
          .to(
            root.querySelectorAll('[data-scene="galleon"]'),
            { opacity: 0, ease: 'none' },
            0.25,
          )
          .to(
            root.querySelectorAll('[data-scene="chest"]'),
            { opacity: 0, ease: 'none' },
            0.15,
          )
          // Wind picks up — palms bend further (sustained, not animated)
          .to(
            palmLeft,
            { rotate: 8, ease: 'none' },
            0.2,
          )
          .to(
            palmRight,
            { rotate: -8, ease: 'none' },
            0.2,
          )
          // Palms fade out as the sunny scene fully exits — the backdrop has
          // its own atmospheric layer, no need for sunny palms to linger.
          .to(
            [palmLeft, palmRight].filter(Boolean),
            { opacity: 0, ease: 'none' },
            0.7,
          );

        // ── Sail-across Dutchman band (one-time on entry) ──
        const bandEl = root.querySelector<HTMLElement>('.dutchman-band');
        const shipWrap = root.querySelector<HTMLElement>(
          '[data-band="ship-wrap"]',
        );
        const bandLightning = root.querySelector<HTMLElement>(
          '[data-band="lightning"]',
        );
        const bandAura = root.querySelector<SVGElement>('.dutchman-band__aura');
        let bandLightningHandle: gsap.core.Tween | null = null;

        if (bandEl && shipWrap) {
          // Park ship offscreen-left until the trigger fires.
          gsap.set(shipWrap, { xPercent: -100 });

          if (bandAura) {
            // Subtle aura pulse — runs continuously while ship is on screen.
            gsap.to(bandAura, {
              opacity: 0.6,
              duration: 3.5,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            });
          }

          ScrollTrigger.create({
            trigger: bandEl,
            start: 'top 80%',
            once: true,
            onEnter: () => {
              // 8s constant-speed crossing, fully offscreen-right at end.
              gsap.fromTo(
                shipWrap,
                { xPercent: -100 },
                {
                  xPercent: 200,
                  duration: 8,
                  ease: 'none',
                  onComplete: () => {
                    // Ship has exited; start ambient lightning over empty horizon.
                    const scheduleBandLightning = (): void => {
                      const wait = 6 + Math.random() * 7; // 6..13s
                      bandLightningHandle = gsap.to({}, {
                        duration: wait,
                        onComplete: () => {
                          if (!bandLightning) return;
                          const tl2 = gsap.timeline({
                            onComplete: scheduleBandLightning,
                          });
                          tl2
                            .to(bandLightning, { opacity: 0.5, duration: 0.06 })
                            .to(bandLightning, { opacity: 0, duration: 0.08 })
                            .to(
                              bandLightning,
                              { opacity: 0.32, duration: 0.05 },
                              '+=0.05',
                            )
                            .to(bandLightning, {
                              opacity: 0,
                              duration: 0.4,
                              ease: 'power2.out',
                            });
                        },
                      });
                    };
                    scheduleBandLightning();
                  },
                },
              );
            },
          });
        }

        // Cleanup: kill both lightning schedulers when context reverts
        return () => {
          if (lightningHandle) lightningHandle.kill();
          if (bandLightningHandle) bandLightningHandle.kill();
        };
      });

      // Refresh ScrollTrigger after layout settles (fonts, charts query, etc.)
      ScrollTrigger.refresh();
    },
    { scope: rootRef },
  );

  return (
    <div className="landing" ref={rootRef}>
      {/* PERSISTENT DARK/RAIN/DUTCHMAN BACKDROP — sits behind everything, full
          height of the route. The sunny hero composites OVER it; as scroll
          fades the sunny layers, this backdrop is revealed and persists
          through categories + ship-band + motto. */}
      <div className="landing__backdrop" aria-hidden>
        <div className="landing__backdrop-haze" />
        {/* Two parallax rain layers — animated by GSAP (transform: translateY) */}
        <div className="landing__rain landing__rain--back" data-backdrop="rain-back" />
        <div className="landing__rain" data-backdrop="rain-front" />
        {/* Sticky rail keeps the spectral Dutchman pinned at the viewport
            horizon as the user scrolls past the hero. */}
        <div className="landing__backdrop-dutchman-rail">
          <div className="landing__backdrop-aura" data-backdrop="aura" />
          {/* Wake / motion trails behind the Dutchman */}
          <div className="landing__backdrop-trails" data-backdrop="trails">
            <div
              className="landing__backdrop-trail landing__backdrop-trail--1"
              data-backdrop="trail"
            />
            <div
              className="landing__backdrop-trail landing__backdrop-trail--2"
              data-backdrop="trail"
            />
            <div
              className="landing__backdrop-trail landing__backdrop-trail--3"
              data-backdrop="trail"
            />
            <div
              className="landing__backdrop-trail landing__backdrop-trail--4"
              data-backdrop="trail"
            />
          </div>
          {/* Spectral Dutchman — green hull, glowing aura, tattered sails.
              CENTERED on the horizon and ongoing motion (drift + bob). */}
          <svg
            className="landing__backdrop-dutchman"
            data-backdrop="dutchman"
            viewBox="0 0 380 240"
            aria-hidden
          >
            <defs>
              <radialGradient id="bdDutchAura" cx="50%" cy="55%" r="55%">
                <stop offset="0%" stopColor="#5fff9a" stopOpacity="0.36" />
                <stop offset="60%" stopColor="#3aa05a" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0a3a1a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="bdDutchHull" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f5232" />
                <stop offset="100%" stopColor="#062612" />
              </linearGradient>
              <linearGradient id="bdDutchSail" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a8a52" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0d2a18" stopOpacity="0.6" />
              </linearGradient>
              <filter
                id="bdDutchGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            <ellipse
              cx="190"
              cy="150"
              rx="200"
              ry="80"
              fill="url(#bdDutchAura)"
            />
            <ellipse
              cx="190"
              cy="140"
              rx="170"
              ry="60"
              fill="#5fff9a"
              fillOpacity="0.07"
              filter="url(#bdDutchGlow)"
            />
            <g>
              {/* hull — green spectral, with green-edge glow stroke */}
              <path
                d="M40 150 Q 52 196 110 200 L 270 200 Q 328 196 340 150 L 320 156 L 60 156 Z"
                fill="url(#bdDutchHull)"
                stroke="#5fff9a"
                strokeOpacity="0.5"
                strokeWidth="1.2"
              />
              {/* hull rib glints */}
              <path
                d="M70 168 L 80 188 M 130 162 L 138 186 M 220 164 L 226 188 M 290 166 L 298 186"
                stroke="#5fff9a"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
              {/* bowsprit */}
              <path
                d="M340 150 L 374 132"
                stroke="#1f5232"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* masts */}
              <path d="M190 150 L 190 18" stroke="#1f5232" strokeWidth="3" />
              <path d="M120 150 L 120 38" stroke="#1f5232" strokeWidth="2.6" />
              <path d="M260 150 L 260 50" stroke="#1f5232" strokeWidth="2.6" />
              {/* yardarms */}
              <path d="M150 56 L 230 56" stroke="#1f5232" strokeWidth="1.6" />
              <path d="M88 70 L 152 70" stroke="#1f5232" strokeWidth="1.4" />
              <path d="M228 78 L 292 78" stroke="#1f5232" strokeWidth="1.4" />
              {/* tattered sails */}
              <path
                d="M152 60 L 228 60 L 232 116 Q 220 122 200 120 L 196 110 L 188 122 L 178 110 L 168 124 L 156 110 Z"
                fill="url(#bdDutchSail)"
                stroke="#5fff9a"
                strokeOpacity="0.4"
                strokeWidth="0.8"
              />
              <path
                d="M90 74 L 150 74 L 152 120 Q 140 124 122 122 L 118 112 L 110 124 L 102 112 L 94 124 Z"
                fill="url(#bdDutchSail)"
                stroke="#5fff9a"
                strokeOpacity="0.36"
                strokeWidth="0.8"
              />
              <path
                d="M230 82 L 290 82 L 292 126 Q 280 130 264 128 L 260 118 L 252 130 L 244 118 L 236 130 Z"
                fill="url(#bdDutchSail)"
                stroke="#5fff9a"
                strokeOpacity="0.36"
                strokeWidth="0.8"
              />
              {/* small flag */}
              <path d="M190 18 L 212 24 L 190 30 Z" fill="#5fff9a" fillOpacity="0.6" />
              {/* lantern point on bowsprit */}
              <circle cx="320" cy="150" r="2.5" fill="#a4ffc4" opacity="0.95" />
            </g>
          </svg>
        </div>
      </div>

      {/* HERO — the cinematic two-state pinned section */}
      <section className="landing__hero" aria-labelledby="landing-heading">
        <HeroScene />
        <HeroSceneStatic />

        <div className="landing__hero-content">
          <p className="landing__eyebrow">{strings.landing.eyebrow}</p>
          <h1
            id="landing-heading"
            className="landing__title"
          >
            <span className="landing__title-brand">{strings.landing.heroBrand}</span>
            <span className="landing__title-name">{strings.landing.heroTitle}</span>
          </h1>
          <p className="landing__lede">{strings.landing.lede}</p>

          <div className="landing__cta">
            <Link
              to="/signup"
              className="pc-btn pc-btn--primary pc-btn--lg landing__cta-btn"
            >
              {strings.landing.ctaPrimary}
            </Link>
            <Link
              to="/login"
              className="pc-btn pc-btn--secondary pc-btn--lg landing__cta-btn"
            >
              {strings.landing.ctaSecondary}
            </Link>
          </div>

          <div
            className="landing__meta"
            role="group"
            aria-label={strings.brand}
          >
            <div className="landing__meta-cell">
              <div className="landing__meta-value">
                {strings.landing.metaIslandsCount}
              </div>
              <div className="landing__meta-label">
                {strings.landing.metaIslandsLabel}
              </div>
            </div>
            <span className="landing__meta-rule" aria-hidden />
            <div className="landing__meta-cell">
              <div className="landing__meta-value">
                {strings.landing.metaCategoriesCount}
              </div>
              <div className="landing__meta-label">
                {strings.landing.metaCategoriesLabel}
              </div>
            </div>
            <span className="landing__meta-rule" aria-hidden />
            <div className="landing__meta-cell">
              <div className="landing__meta-value" aria-live="polite">
                {crewCount}
              </div>
              <div className="landing__meta-label">
                {strings.landing.metaCrewsLabel}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CATEGORIES — sit on top of the storm scene that scrolled in */}
      <section
        className="landing__categories"
        aria-labelledby="landing-categories-heading"
      >
        <header className="landing__cat-header">
          <h2
            id="landing-categories-heading"
            className="landing__cat-heading font-display"
          >
            {strings.landing.categoriesHeading}
          </h2>
          <p className="landing__cat-lede">{strings.landing.categoriesLede}</p>
        </header>
        <ul className="landing__cat-grid">
          {CATEGORY_ORDER.map((slug) => {
            const c = strings.landing.categories[slug];
            return (
              <li key={slug} className="landing__cat-card">
                <span className="landing__cat-glyph" aria-hidden>
                  <CategoryGlyph slug={slug} />
                </span>
                <h3 className="landing__cat-name font-display">{c.themed}</h3>
                <p className="landing__cat-plain">{c.plain}</p>
                <p className="landing__cat-blurb">{c.blurb}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SAIL-ACROSS DUTCHMAN BAND — full-bleed, between cards and motto */}
      <section className="landing__ship-band" aria-hidden>
        <DutchmanBand />
        <DutchmanBandStatic />
      </section>

      {/* CLOSING MOTTO */}
      <p className="landing__motto">{strings.landing.closingMotto}</p>
    </div>
  );
}
