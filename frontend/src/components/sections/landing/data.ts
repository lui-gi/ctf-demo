/* ─── Landing page — shared data ──────────────────────────────────
   Constants consumed by multiple landing sections. Kept out of the
   per-section components so they can be tree-shaken / reused. */

import type { JSX } from 'react'
import {
  CompassRose, JollyRoger, Anchor, ShipWheel, Cutlasses,
  Coins, TreasureChest, XSpot, Scroll, LogDial,
} from '../../ui/PirateMotifs'

export interface IconCmp {
  (p: { size?: number; strokeWidth?: number; className?: string }): JSX.Element
}

export const EVENT_AT = new Date('2026-11-07T00:00:00').getTime()

export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'

export const CHALLENGES: {
  name: string
  flavor: string
  Icon: IconCmp
  difficulty: Difficulty
  sponsored?: true
}[] = [
  {
    name: 'Web Exploitation',
    flavor: 'Find the cracks in the hull. Bypass auth, abuse logic, and chain bugs into a full takeover.',
    Icon: ShipWheel,
    difficulty: 'medium',
  },
  {
    name: 'Cryptography',
    flavor: 'Crack ancient codes and modern ciphers. The math is unforgiving, but the loot is sweeter for it.',
    Icon: LogDial,
    difficulty: 'hard',
  },
  {
    name: 'Network and Log Analysis',
    flavor: 'Read the tides. Parse packet captures and log trails to piece together what moved through these waters.',
    Icon: CompassRose,
    difficulty: 'medium',
  },
  {
    name: 'Forensics',
    flavor: 'Dig through disk images, memory dumps, and corrupted files. The evidence is in there somewhere.',
    Icon: TreasureChest,
    difficulty: 'medium',
  },
  {
    name: 'OSINT',
    flavor: 'Scout the open web, follow the breadcrumbs, and surface what no chart will show you.',
    Icon: XSpot,
    difficulty: 'easy',
  },
  {
    name: 'Steganography',
    flavor: 'The message is hidden in plain sight. Images, audio, text — contraband concealed in cargo.',
    Icon: Scroll,
    difficulty: 'easy',
  },
  {
    name: 'Password Cracking',
    flavor: 'Every lock has a key. Wordlists, rules, and raw compute — break what stands between you and the treasure.',
    Icon: JollyRoger,
    difficulty: 'hard',
  },
  {
    name: "Patron's Plunder",
    flavor:
      "Challenges crafted in partnership with those who back this voyage. " +
      "Sponsor-tailored hunts with a twist you won't find on any ordinary chart.",
    Icon: Coins,
    difficulty: 'mixed',
    sponsored: true,
  },
]

export const TIERS: { name: string; pitch: string; copy: string; Icon: IconCmp }[] = [
  {
    name: 'Captain Tier',
    pitch: 'Top of the rigging.',
    copy:
      'Your name carries the ship. Logo on the main banner, opening keynote, naming rights ' +
      'on a featured challenge category, and a dedicated booth at the live event for recruiting.',
    Icon: ShipWheel,
  },
  {
    name: 'Anchor Tier',
    pitch: 'Steady weight, deep reach.',
    copy:
      'Logo placement across the event site and stage screens, branded swag in every welcome ' +
      'pack, a recruiting table at finals, and shoutouts across our social channels in the lead-up.',
    Icon: Anchor,
  },
  {
    name: 'Crew Tier',
    pitch: 'Aboard the manifest.',
    copy:
      'A confirmed spot on the sponsor manifest, logo on the official site, an invitation to ' +
      'mingle with finalists at the closing ceremony, and a social mention in our recap reel after the event.',
    Icon: Cutlasses,
  },
]

export interface Parts { days: number; hours: number; minutes: number; seconds: number; done: boolean }

export function diffParts(now: number): Parts {
  const ms = EVENT_AT - now
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  }
}

export const pad = (n: number) => n.toString().padStart(2, '0')
