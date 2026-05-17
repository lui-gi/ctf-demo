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
  details: string
  examples: string[]
  Icon: IconCmp
  difficulty: Difficulty
  sponsored?: true
}[] = [
  {
    name: 'Web Exploitation',
    flavor: 'Find the cracks in the hull. Bypass auth, abuse logic, and chain bugs into a full takeover.',
    details:
      'You will be handed a running web app and asked to break it. Hunt for SQL injection, cross-site scripting, broken auth, IDOR, file upload flaws, and logic mistakes. Most flags live behind one good chain of two or three small bugs.',
    examples: [
      'Bypass a login that trusts client-side validation',
      'Pull data with a blind SQL injection',
      'Escalate a session cookie into an admin take-over',
    ],
    Icon: ShipWheel,
    difficulty: 'medium',
  },
  {
    name: 'Cryptography',
    flavor: 'Crack ancient codes and modern ciphers. The math is unforgiving, but the loot is sweeter for it.',
    details:
      'Classical ciphers, modern stream and block ciphers, weak RSA, padding oracles, and homemade schemes built on cracked foundations. Sharp pen, sharper math.',
    examples: [
      'Recover a key from a low-exponent RSA puzzle',
      'Crack a stream cipher reused across two messages',
      'Decode a hand-rolled Caesar / Vigenère stack',
    ],
    Icon: LogDial,
    difficulty: 'hard',
  },
  {
    name: 'Network and Log Analysis',
    flavor: 'Read the tides. Parse packet captures and log trails to piece together what moved through these waters.',
    details:
      'PCAPs, server logs, and access trails. Track an intruder across the network, find what they exfiltrated, or untangle a stretch of suspicious traffic.',
    examples: [
      'Spot a hidden C2 channel inside DNS traffic',
      'Reassemble files transferred over a captured session',
      'Trace a brute-force across web logs back to a single IP',
    ],
    Icon: CompassRose,
    difficulty: 'medium',
  },
  {
    name: 'Forensics',
    flavor: 'Dig through disk images, memory dumps, and corrupted files. The evidence is in there somewhere.',
    details:
      'Mounted disk images, memory snapshots, broken archives, and recovered partitions. Carve files out of raw bytes, follow timestamps, and rebuild what someone tried to erase.',
    examples: [
      'Recover deleted files from a disk image',
      'Pull a password out of a memory dump',
      'Repair a damaged ZIP and read what was inside',
    ],
    Icon: TreasureChest,
    difficulty: 'medium',
  },
  {
    name: 'OSINT',
    flavor: 'Scout the open web, follow the breadcrumbs, and surface what no chart will show you.',
    details:
      'Open-source intelligence. Reverse image search, social media tracing, public records, code-search engines, and metadata. Find the person, the place, or the thing without ever logging into anything privileged.',
    examples: [
      'Identify a location from a single photo',
      'Trace an alias across forums and code hosts',
      'Find an old upload that someone thought was deleted',
    ],
    Icon: XSpot,
    difficulty: 'easy',
  },
  {
    name: 'Steganography',
    flavor: 'The message is hidden in plain sight. Images, audio, text. Contraband concealed in cargo.',
    details:
      'Data smuggled inside other data. LSB tricks in PNGs, hidden tracks in audio, whitespace patterns in text, metadata leaks, and homemade encodings. The cover file looks innocent until you look closer.',
    examples: [
      'Pull a hidden payload out of an image\'s least-significant bits',
      'Find a flag whispered into a WAV file',
      'Read invisible whitespace encoded in a document',
    ],
    Icon: Scroll,
    difficulty: 'easy',
  },
  {
    name: 'Password Cracking',
    flavor: 'Every lock has a key. Wordlists, rules, and raw compute. Break what stands between you and the treasure.',
    details:
      'Hashed passwords, salted secrets, and protected archives. Combine wordlists, rules, masks, and GPUs to break what was supposed to stay locked. Speed matters; so does picking the right rule set.',
    examples: [
      'Crack a list of bcrypt hashes against a tailored wordlist',
      'Recover a forgotten archive password by rule-mutation',
      'Break a custom hash by reverse-engineering the algorithm',
    ],
    Icon: JollyRoger,
    difficulty: 'hard',
  },
  {
    name: "Patron's Plunder",
    flavor:
      "Challenges crafted in partnership with those who back this voyage. " +
      "Sponsor-tailored hunts with a twist you won't find on any ordinary chart.",
    details:
      'A sponsor-authored track with challenges that pull from the sponsor\'s own stack. Expect one or two unusual problem shapes you have not seen at other events.',
    examples: [
      'A puzzle built on the sponsor\'s real product surface',
      'A guest challenge from a sponsor engineer',
      'Bonus loot for the crew that finishes the track first',
    ],
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
