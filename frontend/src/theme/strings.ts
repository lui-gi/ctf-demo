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
  brandTagline: 'by progsu',

  // ── Navigation ───────────────────────────────────────────────────
  // Chrome verbs go plain English (vocabulary pivot 2026-05-02). The themed
  // "voyageSubtitle" / "chartsSubtitle" entries below let pages render a
  // themed flavor line under the plain heading.
  nav: {
    voyage: 'Challenges',
    charts: 'Leaderboard',
    terminal: "Crow's Nest",
    crew: 'My Team',
    admin: 'Admin',
    logout: 'Logout',
    boardLink: 'Login',
    signLink: 'Sign Up',
  },

  // ── Auth flow ────────────────────────────────────────────────────
  auth: {
    // The `landing*` keys below are still referenced by the legacy
    // Landing.tsx (homepage agent's territory). Left intact during the
    // homepage rebuild — the new `landing.*` namespace below replaces them.
    landingHeading: 'progctf — The Voyage',
    landingBlurb:
      'A Capture-the-Flag voyage hosted by Deadwake. Thirty Islands, seven clusters, one Pirate King. Sign the Articles to claim your place on The Charts.',
    landingEyebrow: 'Deadwake presents',
    landingMetaIslandsLabel: 'Islands',
    landingMetaCategoriesLabel: 'Clusters',
    landingMetaCrewsLabel: 'Crews aboard',
    landingMetaUnknown: '—',
    landingCategoriesHeading: 'Seven clusters. Thirty Islands. One Voyage.',
    landingCategoriesLede:
      "Each cluster is its own coastline. Cut your teeth in The Port; brave the Cursed Depths if your Crew is hardened.",
    landingFooterMotto: 'Charted by Deadwake. Sailed by you.',
    landingTierLabel: 'Tiers',
    landingTierPort: 'The Port',
    landingTierOpen: 'Open Sea',
    landingTierDepths: 'Cursed Depths',
    signArticlesHeading: 'Sign Up',
    signArticlesSubmit: 'Sign Up',
    boardHeading: 'Login',
    boardSubmit: 'Login',
    emailLabel: 'Email',
    handleLabel: 'Handle',
    passwordLabel: 'Password',
    crewInviteLabel: 'Team invite code (optional)',
    rememberCrewName: 'Team name',
    haveAccount: 'Already have an account?',
    noAccount: 'New here?',
    logoutSuccess: 'Logged out. Fair winds.',
    sessionExpired: 'Your session has expired. Log in again.',
  },

  // ── Voyage / category map ────────────────────────────────────────
  voyage: {
    heading: 'Challenges',
    // Themed flavor line shown under the plain heading (vocabulary pivot).
    headingThemed: 'The Voyage',
    subtitle: 'Seven clusters of challenges. Choose your heading.',
    solveCount: (n: number, total: number): string =>
      `${n} of ${total} solved`,
    crewSolveBadge: (n: number): string =>
      n === 1 ? '1 solve' : `${n} solves`,
    categoryNames: {
      cursed_ports: 'Cursed Ports',
      cipher_cove: 'Cipher Cove',
      shipwrights_forge: "Shipwright's Forge",
      lighthouse: 'Lighthouse',
      crows_nest: "Crow's Nest",
      hidden_cargo: 'Hidden Cargo',
      keymaster: 'Keymaster',
    } as Record<string, string>,
    // Plain English subtitle shown alongside each themed category name
    // (vocabulary pivot — players shouldn't have to translate).
    categoryPlainNames: {
      cursed_ports: 'Web Exploitation',
      cipher_cove: 'Cryptography',
      shipwrights_forge: 'Network & Log Analysis',
      lighthouse: 'Forensics',
      crows_nest: 'OSINT',
      hidden_cargo: 'Steganography',
      keymaster: 'Password Cracking',
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
    // Plain difficulty labels — paired with the themed labels above by the
    // <DifficultyPill /> component.
    difficultyPlainLabels: {
      port: 'Easy',
      open_sea: 'Medium',
      cursed_depths: 'Hard',
    } as Record<string, string>,
    backToVoyage: 'Back to Challenges',
  },

  // ── Island detail / submission ───────────────────────────────────
  island: {
    pointsLabel: 'Bounty',
    pointsValue: (n: number): string => `${n} pts`,
    statusSolved: 'Treasure secured',
    statusFirstBlood: 'First blood',
    submitHeading: 'Submit Flag',
    submitPlaceholder: 'progctf{...}',
    submitButton: 'Submit Flag',
    submitWorking: 'Submitting…',
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
    // User-locked: the button verb is "Show Hint" (plain), but the in-world
    // mechanic is still called a Whisper in narrative copy.
    revealWhisper: (cost: number): string => `Show Hint (-${cost} pts)`,
    whisperRevealing: 'Loading…',
    whisperRevealed: 'Hint revealed.',
    filesHeading: 'Provisions',
    filesEmpty: 'No provisions for this Island.',
    descriptionHeading: 'The Tale',
  },

  // ── Charts / leaderboard ─────────────────────────────────────────
  charts: {
    heading: 'Leaderboard',
    // Themed flavor subtitle shown under the plain heading.
    headingThemed: 'The Charts',
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
    // Page heading uses plain "Team"; in-narrative copy keeps "Crew".
    headingPrefix: 'Team',
    notFound: 'No such team found.',
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
    yes: 'Yes',
    no: 'No',
    notFound: "These waters aren't on any map.",
    notFoundHeading: 'Off the chart',
    notFoundCta: 'Return to Challenges',
    forbidden: "You don't have access to this page.",
    requireLogin: 'Sign Up or Login to continue.',
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

  // ── Landing (homepage rebuild — append-only namespace) ───────────
  // The cinematic two-state hero (sunny → stormy Flying Dutchman) and the
  // 7-cluster grid below it both pull copy from this namespace exclusively.
  // Keep the lowercase "progctf" / "progsu" exact — branding is locked.
  landing: {
    eyebrow: 'progsu presents',
    heroBrand: 'progctf',
    heroTitle: 'Encrypted Treasures',
    lede: 'Seven clusters. Thirty challenges. Every solve is a treasure.',
    ctaPrimary: 'Sign Up',
    ctaSecondary: 'Login',
    metaIslandsCount: '30',
    metaIslandsLabel: 'Challenges',
    metaCategoriesCount: '7',
    metaCategoriesLabel: 'Clusters',
    metaCrewsLabel: 'Crews aboard',
    metaUnknown: '—',
    categoriesHeading: 'Seven clusters. Thirty challenges. One event.',
    categoriesLede: 'Pick your coastline. Each cluster has its own discipline.',
    // Cluster cards — each shows a themed name (display brass) + plain English
    // subtitle (sans, ink-on-dark) + a one-line description.
    categories: {
      cipher_cove: {
        themed: 'Cipher Cove',
        plain: 'Cryptography',
        blurb: 'Where ciphers come to drown. Bring a sharp pencil.',
      },
      cursed_ports: {
        themed: 'Cursed Ports',
        plain: 'Web Exploitation',
        blurb: 'Mind the broken planks. Every dock hides a splintered board.',
      },
      shipwrights_forge: {
        themed: "Shipwright's Forge",
        plain: 'Network & Log Analysis',
        blurb: 'Read the wood, rewrite the wake. Trace what passed through.',
      },
      lighthouse: {
        themed: 'Lighthouse',
        plain: 'Forensics',
        blurb: 'Whose lantern was lit, and when? Reconstruct the night.',
      },
      crows_nest: {
        themed: "Crow's Nest",
        plain: 'OSINT',
        blurb: 'Look further than the horizon. Public maps tell private tales.',
      },
      hidden_cargo: {
        themed: 'Hidden Cargo',
        plain: 'Steganography',
        blurb: 'Cargo holds hold secrets. Look between the boards.',
      },
      keymaster: {
        themed: 'Keymaster',
        plain: 'Password Cracking',
        blurb: 'Every lock has a key. Some keys must be guessed.',
      },
    } as Record<
      string,
      { themed: string; plain: string; blurb: string }
    >,
    closingMotto: 'Charted by progsu. Sailed by you.',
  },

  // ── Admin ────────────────────────────────────────────────────────
  admin: {
    heading: 'Admin',
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
