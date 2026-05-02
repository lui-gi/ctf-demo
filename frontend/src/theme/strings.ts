/**
 * Centralized themed copy table for progctf.
 *
 * RULE: every piece of UI copy lives here. Components must NOT contain
 * hardcoded English strings. The string-coverage test enforces this by
 * grepping `src/` for sentence-style English not referenced from this file.
 *
 * Function-style entries take parameters and return formatted strings,
 * so we never assemble user-visible sentences via inline template literals
 * elsewhere.
 */

export const strings = {
  brand: 'progctf',
  brandTagline: 'A Voyage by Deadwake',

  // ── Navigation ───────────────────────────────────────────────────
  nav: {
    voyage: 'The Voyage',
    charts: 'The Charts',
    terminal: "Crow's Nest",
    crew: 'My Crew',
    admin: "Captain's Quarters",
    logout: 'Walk the Plank',
    boardLink: 'Board the Ship',
    signLink: 'Sign the Articles',
  },

  // ── Auth flow ────────────────────────────────────────────────────
  auth: {
    landingHeading: 'A Voyage Awaits',
    landingBlurb:
      'Sign the Articles or Board the Ship to claim your place on The Charts.',
    signArticlesHeading: 'Sign the Articles',
    signArticlesSubmit: 'Sign the Articles',
    boardHeading: 'Board the Ship',
    boardSubmit: 'Board the Ship',
    emailLabel: 'Letter of Marque (email)',
    handleLabel: 'Pirate name (handle)',
    passwordLabel: 'Secret phrase',
    crewInviteLabel: 'Crew invite code (optional)',
    rememberCrewName: 'Crew name',
    haveAccount: 'Already aboard?',
    noAccount: 'New to these waters?',
    logoutSuccess: 'You walked the plank. Fair winds.',
    sessionExpired: 'Your charter has lapsed. Board the Ship again.',
  },

  // ── Voyage / category map ────────────────────────────────────────
  voyage: {
    heading: 'The Voyage',
    subtitle: 'Seven clusters of Islands. Choose your heading.',
    solveCount: (n: number, total: number): string =>
      `${n} of ${total} Treasures claimed`,
    crewSolveBadge: (n: number): string =>
      n === 1 ? '1 Treasure secured' : `${n} Treasures secured`,
    categoryNames: {
      cursed_ports: 'Cursed Ports',
      cipher_cove: 'Cipher Cove',
      shipwrights_forge: "Shipwright's Forge",
      lighthouse: 'Lighthouse',
      crows_nest: "Crow's Nest",
      hidden_cargo: 'Hidden Cargo',
      keymaster: 'Keymaster',
    } as Record<string, string>,
    categoryBlurbs: {
      cursed_ports: 'Web exploitation. Mind the broken planks.',
      cipher_cove: 'Cryptography. Where ciphers come to drown.',
      shipwrights_forge: 'Network and log analysis. Read the wake.',
      lighthouse: 'Forensics. Whose lantern was lit, and when?',
      crows_nest: 'OSINT. Look further than the horizon.',
      hidden_cargo: 'Steganography. Cargo holds hold secrets.',
      keymaster: 'Password cracking. Every lock has a key.',
    } as Record<string, string>,
    difficultyLabels: {
      port: 'The Port',
      open_sea: 'Open Sea',
      cursed_depths: 'Cursed Depths',
    } as Record<string, string>,
    backToVoyage: 'Back to The Voyage',
  },

  // ── Island detail / submission ───────────────────────────────────
  island: {
    pointsLabel: 'Bounty',
    pointsValue: (n: number): string => `${n} pts`,
    statusSolved: 'Treasure secured',
    statusFirstBlood: 'First blood',
    submitHeading: 'Submit a Treasure',
    submitPlaceholder: 'progctf{...}',
    submitButton: 'Claim the Treasure',
    submitWorking: 'Hauling the chest aboard…',
    invalidFormat: 'That does not look like a Treasure. Format: progctf{lowercase_snake_case}.',
    wrong: "That ain't no Treasure, sailor.",
    correct: (points: number, crew: string): string =>
      `Aye! Treasure secured. +${points} to ${crew}.`,
    alreadySolved: 'Your Crew has already claimed this Treasure.',
    cooldown: (seconds: number): string =>
      `The cannons are reloading… ${seconds}s`,
    frozenLocked: 'The Voyage is frozen. No more Treasures may be claimed.',
    whispersHeading: 'Whispers',
    whispersEmpty: 'No Whispers carried on the wind for this Island.',
    revealWhisper: (cost: number): string => `Hear the Whisper (-${cost} pts)`,
    whisperRevealing: 'Listening…',
    whisperRevealed: 'Whisper revealed.',
    filesHeading: 'Provisions',
    filesEmpty: 'No provisions for this Island.',
    descriptionHeading: 'The Tale',
  },

  // ── Charts / leaderboard ─────────────────────────────────────────
  charts: {
    heading: 'The Charts',
    subtitle: 'Top Crews on The Voyage. Updates as Treasures are claimed.',
    empty: 'The Charts are blank. No Crew has set sail.',
    frozenBanner: '⚓ The Voyage is frozen. No more Treasures may be claimed.',
    firstBlood: (island: string, crew: string): string =>
      `🩸 First blood on ${island}! ${crew} draws the line.`,
    rank: 'Rank',
    crew: 'Crew',
    score: 'Bounty',
    lastSolve: 'Last claim',
    placements: {
      1: 'Pirate King',
      2: 'Emperor Yonko',
      3: 'Warlord of the Sea',
    } as Record<number, string>,
    reconnecting: 'Re-establishing the spyglass…',
    disconnected: 'Lost the horizon. Trying again…',
    connected: 'Spyglass locked.',
  },

  // ── Closing ceremony (post-freeze reveal screen) ─────────────────
  closingCeremony: {
    header: 'The Charts have closed. The Voyage is over.',
    pirateKing: '🥇 Pirate King',
    emperorYonko: '🥈 Emperor Yonko',
    warlordOfTheSea: '🥉 Warlord of the Sea',
    letterIntro: "Calypso's letter, recovered after the Voyage:",
    finalLine: '— And so the Tides did forget. The Charts close. Pirate King is crowned.',
    loadingTopThree: 'Reading the wind for the final standings…',
    navLink: 'Closing Ceremony',
    notYetHeading: 'The Voyage is still afoot',
    notYet: 'The Voyage is still afoot. Closing Ceremony unlocks at freeze.',
    chartsBannerCta: 'Attend the Closing Ceremony',
    sectionLabelStandings: 'Final standings',
    sectionLabelLetter: "Calypso's letter",
    crewMissing: '— no Crew claimed this rank —',
  },

  // ── Crew profile ─────────────────────────────────────────────────
  crew: {
    headingPrefix: 'Crew',
    notFound: 'No such Crew sails these waters.',
    solvedHeading: 'Treasures Claimed',
    membersHeading: 'Sailors aboard',
    inviteCode: 'Invite code',
    bountyTotal: (n: number): string => `${n} pts in the hold`,
    joined: (when: string): string => `Set sail ${when}`,
    roleAdminBadge: 'Captain',
  },

  // ── Terminal ─────────────────────────────────────────────────────
  terminal: {
    heading: "Crow's Nest Terminal",
    subtitle:
      'A sandboxed line to the Island. Some Islands listen here, others only echo.',
    connecting: 'Lowering the speaking-trumpet…',
    connected: 'Trumpet open.',
    disconnected: 'The line went silent.',
    slugLabel: 'Island slug',
    openButton: 'Open the line',
  },

  // ── Generic UI ───────────────────────────────────────────────────
  common: {
    loading: 'Charting course…',
    error: (msg?: string): string =>
      msg ? `The seas turned against us: ${msg}` : 'The seas turned against us.',
    retry: 'Try again',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    yes: 'Aye',
    no: 'Nay',
    notFound: "These waters aren't on any map.",
    notFoundHeading: 'Off the chart',
    notFoundCta: 'Return to The Voyage',
    forbidden: 'These quarters are not yours to enter.',
    requireLogin: 'Sign the Articles or Board the Ship to continue.',
    breadcrumbHome: 'Home',
  },

  // ── Toasts ───────────────────────────────────────────────────────
  toast: {
    saved: 'Saved.',
    failed: 'That did not take.',
    networkDown: 'No signal from the shore.',
    region: 'Notifications',
    dismiss: 'Dismiss',
  },

  // ── Aria labels for landmark regions / icon-only controls ───────
  aria: {
    primaryNav: 'Primary',
    adminTabs: 'Admin sections',
    firstBloodFeed: 'First blood feed',
    actionsColumn: 'Actions',
    rowActions: 'Row actions',
  },

  // ── Admin ────────────────────────────────────────────────────────
  admin: {
    heading: "Captain's Quarters",
    subtitle: 'Manage Islands, watch submissions, freeze The Voyage.',
    tabs: {
      islands: 'Islands',
      submissions: 'Submission log',
      moderation: 'Moderation',
      voyage: 'Voyage controls',
    },
    islands: {
      heading: 'Islands',
      newIsland: 'New Island',
      editIsland: 'Edit Island',
      title: 'Title',
      slug: 'Slug',
      category: 'Category',
      difficulty: 'Difficulty',
      basePoints: 'Base bounty',
      description: 'Description (markdown)',
      preview: 'Preview',
      files: 'Files',
      sandboxImage: 'Sandbox image tag',
      whispers: 'Whispers (up to 3)',
      addWhisper: 'Add a Whisper',
      removeWhisper: 'Remove',
      whisperBody: 'Body (markdown)',
      whisperCost: 'Cost (pts)',
      status: 'Status',
      slugHint: 'lowercase, hyphens',
      canonicalFlag: 'Canonical flag (stored hashed)',
      sandboxImagePlaceholder: 'registry.example.com/progctf/island-foo:latest',
      statusDraft: 'Draft',
      statusPublished: 'Published',
      statusArchived: 'Archived',
      saveIsland: 'Save Island',
      cancel: 'Cancel',
      rebuildSandbox: 'Rebuild sandbox',
      delete: 'Delete Island',
      confirmDelete: 'Sink this Island? This cannot be undone.',
    },
    submissions: {
      heading: 'Submission log',
      filterCrew: 'Filter by Crew',
      filterIsland: 'Filter by Island',
      filterCorrect: 'Result',
      filterDateFrom: 'From',
      filterDateTo: 'To',
      correctOnly: 'Correct only',
      incorrectOnly: 'Incorrect only',
      all: 'All',
      empty: 'No submissions match the filter.',
      column: {
        when: 'When',
        crew: 'Crew',
        pirate: 'Pirate',
        island: 'Island',
        submitted: 'Submitted',
        result: 'Result',
        points: 'Points',
        ip: 'IP',
      },
    },
    moderation: {
      heading: 'Moderation',
      banCrew: 'Ban a Crew',
      banPirate: 'Ban a Pirate',
      crewIdLabel: 'Crew id',
      pirateIdLabel: 'Pirate id',
      banButton: 'Ban',
      banConfirm: (subject: string): string => `Ban ${subject}? They will lose access immediately.`,
      bannedSuccess: 'Banned.',
    },
    voyage: {
      heading: 'Voyage controls',
      freezeButton: 'Freeze The Voyage',
      unfreezeButton: 'Unfreeze The Voyage',
      freezeConfirm:
        'Freeze The Voyage? Submissions will be rejected until you unfreeze.',
      recalcButton: 'Recalculate The Charts',
      recalcConfirm: 'Force a full leaderboard recalc and Redis flush?',
      sandboxRebuildAll: 'Rebuild all sandboxes',
      sandboxConfirm: 'Rebuild all challenge sandboxes? This is disruptive.',
    },
  },
} as const;

export type Strings = typeof strings;
