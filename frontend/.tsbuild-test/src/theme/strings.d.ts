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
export declare const strings: {
    readonly brand: "progctf";
    readonly brandTagline: "A Voyage by Deadwake";
    readonly nav: {
        readonly voyage: "The Voyage";
        readonly charts: "The Charts";
        readonly terminal: "Crow's Nest";
        readonly crew: "My Crew";
        readonly admin: "Captain's Quarters";
        readonly logout: "Walk the Plank";
        readonly boardLink: "Board the Ship";
        readonly signLink: "Sign the Articles";
    };
    readonly auth: {
        readonly landingHeading: "A Voyage Awaits";
        readonly landingBlurb: "Sign the Articles or Board the Ship to claim your place on The Charts.";
        readonly signArticlesHeading: "Sign the Articles";
        readonly signArticlesSubmit: "Sign the Articles";
        readonly boardHeading: "Board the Ship";
        readonly boardSubmit: "Board the Ship";
        readonly emailLabel: "Letter of Marque (email)";
        readonly handleLabel: "Pirate name (handle)";
        readonly passwordLabel: "Secret phrase";
        readonly crewInviteLabel: "Crew invite code (optional)";
        readonly rememberCrewName: "Crew name";
        readonly haveAccount: "Already aboard?";
        readonly noAccount: "New to these waters?";
        readonly logoutSuccess: "You walked the plank. Fair winds.";
        readonly sessionExpired: "Your charter has lapsed. Board the Ship again.";
    };
    readonly voyage: {
        readonly heading: "The Voyage";
        readonly subtitle: "Seven clusters of Islands. Choose your heading.";
        readonly solveCount: (n: number, total: number) => string;
        readonly crewSolveBadge: (n: number) => string;
        readonly categoryNames: Record<string, string>;
        readonly categoryBlurbs: Record<string, string>;
        readonly difficultyLabels: Record<string, string>;
        readonly backToVoyage: "Back to The Voyage";
    };
    readonly island: {
        readonly pointsLabel: "Bounty";
        readonly pointsValue: (n: number) => string;
        readonly statusSolved: "Treasure secured";
        readonly statusFirstBlood: "First blood";
        readonly submitHeading: "Submit a Treasure";
        readonly submitPlaceholder: "progctf{...}";
        readonly submitButton: "Claim the Treasure";
        readonly submitWorking: "Hauling the chest aboard…";
        readonly invalidFormat: "That does not look like a Treasure. Format: progctf{lowercase_snake_case}.";
        readonly wrong: "That ain't no Treasure, sailor.";
        readonly correct: (points: number, crew: string) => string;
        readonly alreadySolved: "Your Crew has already claimed this Treasure.";
        readonly cooldown: (seconds: number) => string;
        readonly frozenLocked: "The Voyage is frozen. No more Treasures may be claimed.";
        readonly whispersHeading: "Whispers";
        readonly whispersEmpty: "No Whispers carried on the wind for this Island.";
        readonly revealWhisper: (cost: number) => string;
        readonly whisperRevealing: "Listening…";
        readonly whisperRevealed: "Whisper revealed.";
        readonly filesHeading: "Provisions";
        readonly filesEmpty: "No provisions for this Island.";
        readonly descriptionHeading: "The Tale";
    };
    readonly charts: {
        readonly heading: "The Charts";
        readonly subtitle: "Top Crews on The Voyage. Updates as Treasures are claimed.";
        readonly empty: "The Charts are blank. No Crew has set sail.";
        readonly frozenBanner: "⚓ The Voyage is frozen. No more Treasures may be claimed.";
        readonly firstBlood: (island: string, crew: string) => string;
        readonly rank: "Rank";
        readonly crew: "Crew";
        readonly score: "Bounty";
        readonly lastSolve: "Last claim";
        readonly placements: Record<number, string>;
        readonly reconnecting: "Re-establishing the spyglass…";
        readonly disconnected: "Lost the horizon. Trying again…";
        readonly connected: "Spyglass locked.";
    };
    readonly crew: {
        readonly headingPrefix: "Crew";
        readonly notFound: "No such Crew sails these waters.";
        readonly solvedHeading: "Treasures Claimed";
        readonly membersHeading: "Sailors aboard";
        readonly inviteCode: "Invite code";
        readonly bountyTotal: (n: number) => string;
        readonly joined: (when: string) => string;
        readonly roleAdminBadge: "Captain";
    };
    readonly terminal: {
        readonly heading: "Crow's Nest Terminal";
        readonly subtitle: "A sandboxed line to the Island. Some Islands listen here, others only echo.";
        readonly connecting: "Lowering the speaking-trumpet…";
        readonly connected: "Trumpet open.";
        readonly disconnected: "The line went silent.";
        readonly slugLabel: "Island slug";
        readonly openButton: "Open the line";
    };
    readonly common: {
        readonly loading: "Charting course…";
        readonly error: (msg?: string) => string;
        readonly retry: "Try again";
        readonly cancel: "Cancel";
        readonly confirm: "Confirm";
        readonly close: "Close";
        readonly save: "Save";
        readonly yes: "Aye";
        readonly no: "Nay";
        readonly notFound: "These waters aren't on any map.";
        readonly notFoundHeading: "Off the chart";
        readonly notFoundCta: "Return to The Voyage";
        readonly forbidden: "These quarters are not yours to enter.";
        readonly requireLogin: "Sign the Articles or Board the Ship to continue.";
        readonly breadcrumbHome: "Home";
    };
    readonly toast: {
        readonly saved: "Saved.";
        readonly failed: "That did not take.";
        readonly networkDown: "No signal from the shore.";
        readonly region: "Notifications";
        readonly dismiss: "Dismiss";
    };
    readonly aria: {
        readonly primaryNav: "Primary";
        readonly adminTabs: "Admin sections";
        readonly firstBloodFeed: "First blood feed";
        readonly actionsColumn: "Actions";
        readonly rowActions: "Row actions";
    };
    readonly admin: {
        readonly heading: "Captain's Quarters";
        readonly subtitle: "Manage Islands, watch submissions, freeze The Voyage.";
        readonly tabs: {
            readonly islands: "Islands";
            readonly submissions: "Submission log";
            readonly moderation: "Moderation";
            readonly voyage: "Voyage controls";
        };
        readonly islands: {
            readonly heading: "Islands";
            readonly newIsland: "New Island";
            readonly editIsland: "Edit Island";
            readonly title: "Title";
            readonly slug: "Slug";
            readonly category: "Category";
            readonly difficulty: "Difficulty";
            readonly basePoints: "Base bounty";
            readonly description: "Description (markdown)";
            readonly preview: "Preview";
            readonly files: "Files";
            readonly sandboxImage: "Sandbox image tag";
            readonly whispers: "Whispers (up to 3)";
            readonly addWhisper: "Add a Whisper";
            readonly removeWhisper: "Remove";
            readonly whisperBody: "Body (markdown)";
            readonly whisperCost: "Cost (pts)";
            readonly status: "Status";
            readonly slugHint: "lowercase, hyphens";
            readonly canonicalFlag: "Canonical flag (stored hashed)";
            readonly sandboxImagePlaceholder: "registry.example.com/progctf/island-foo:latest";
            readonly statusDraft: "Draft";
            readonly statusPublished: "Published";
            readonly statusArchived: "Archived";
            readonly saveIsland: "Save Island";
            readonly cancel: "Cancel";
            readonly rebuildSandbox: "Rebuild sandbox";
            readonly delete: "Delete Island";
            readonly confirmDelete: "Sink this Island? This cannot be undone.";
        };
        readonly submissions: {
            readonly heading: "Submission log";
            readonly filterCrew: "Filter by Crew";
            readonly filterIsland: "Filter by Island";
            readonly filterCorrect: "Result";
            readonly filterDateFrom: "From";
            readonly filterDateTo: "To";
            readonly correctOnly: "Correct only";
            readonly incorrectOnly: "Incorrect only";
            readonly all: "All";
            readonly empty: "No submissions match the filter.";
            readonly column: {
                readonly when: "When";
                readonly crew: "Crew";
                readonly pirate: "Pirate";
                readonly island: "Island";
                readonly submitted: "Submitted";
                readonly result: "Result";
                readonly points: "Points";
                readonly ip: "IP";
            };
        };
        readonly moderation: {
            readonly heading: "Moderation";
            readonly banCrew: "Ban a Crew";
            readonly banPirate: "Ban a Pirate";
            readonly crewIdLabel: "Crew id";
            readonly pirateIdLabel: "Pirate id";
            readonly banButton: "Ban";
            readonly banConfirm: (subject: string) => string;
            readonly bannedSuccess: "Banned.";
        };
        readonly voyage: {
            readonly heading: "Voyage controls";
            readonly freezeButton: "Freeze The Voyage";
            readonly unfreezeButton: "Unfreeze The Voyage";
            readonly freezeConfirm: "Freeze The Voyage? Submissions will be rejected until you unfreeze.";
            readonly recalcButton: "Recalculate The Charts";
            readonly recalcConfirm: "Force a full leaderboard recalc and Redis flush?";
            readonly sandboxRebuildAll: "Rebuild all sandboxes";
            readonly sandboxConfirm: "Rebuild all challenge sandboxes? This is disruptive.";
        };
    };
};
export type Strings = typeof strings;
