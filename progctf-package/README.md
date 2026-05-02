# progctf — Claude Swarm Build Package

A complete kickoff package for building **progctf**, a pirate-themed CTF run by **Deadwake**, using a Claude Code multi-agent swarm.

## What's in this package

```
progctf-package/
├── 00_MASTER_PROMPT.md        ← THE ONE YOU PASTE FIRST
├── 01_SPEC.md                 ← Technical spec the swarm reads
├── README.md                  ← This file
└── agents/
    ├── bosun.md               ← Backend architect
    ├── helmsman.md            ← Frontend lead
    ├── shipwright.md          ← DevOps / infra
    ├── cartographer.md        ← Challenge designer (the 30 Islands)
    ├── powder_monkey.md       ← Challenge artifact builder
    └── first_mate.md          ← QA + security reviewer
```

## How to use it

### Option A — Claude Code with claude-swarm

1. Drop this whole `progctf-package/` folder into your project root.
2. Open Claude Code in that folder.
3. Paste the contents of `00_MASTER_PROMPT.md` as your first message.
4. When Claude asks to spawn sub-agents, point it at the `agents/` folder. Each sub-agent's system prompt is the corresponding `.md` file.
5. Let it run. The Quartermaster will dispatch in phases. Approve or redirect at milestones.

### Option B — Single Claude Code instance (no swarm)

If you don't have multi-agent set up yet, you can still run this sequentially:

1. Paste `00_MASTER_PROMPT.md` to kick off.
2. When it would dispatch a sub-agent, instead say "Act as the Bosun per `agents/bosun.md` and complete your deliverables."
3. Move through the agents in this order: **Cartographer (specs only) → Bosun + Helmsman + Shipwright (parallel) → Powder Monkey → First Mate → Quartermaster signoff.**

### Option C — Anthropic API multi-agent

Use the Quartermaster prompt as the orchestrator's system prompt. Spawn subordinate agents with each `agents/*.md` file as their system prompt. Pass `01_SPEC.md` to each as a reference document.

## Customization checkpoints

Before you launch, decide:

1. **The 30 challenges.** The Cartographer will draft an `INDEX.md` of all 30 Islands with one-line summaries. Review and edit BEFORE letting Powder Monkey build artifacts. This is your last cheap chance to swap or rebalance ideas.
2. **Theme color palette.** Helmsman has a starter palette; tweak in `agents/helmsman.md` if you want different vibes.
3. **Bounty / prizes.** Pirate King / Yonko / Warlord is locked. If real prizes attach, add details to `OPERATOR_RUNBOOK.md` after Shipwright generates it.
4. **Voyage duration.** 24h? 48h? Weekend? Set this in the runbook.
5. **Crew size cap.** Default suggests no cap; many CTFs cap at 4 or 5 per Crew. Decide and tell the Bosun before they finalize the schema.

## Difficulty calibration reminder

You asked for **HARD with semi-easy entry points**. The package locks this in:

- **8 Port (easy)** — genuine entry points, ~1 per category, 5–20 min, single technique
- **12 Open Sea (medium)** — bulk of the event, 30–90 min, two techniques chained
- **10 Cursed Depths (hard)** — separates top crews, 2–6+ hours, multi-stage, no CVE-lookup wins

The Cartographer prompt has explicit examples of acceptable AND unacceptable challenge ideas at each tier so the swarm doesn't drift into either trivia-fluff or guessing-game-hell.

## Theme vocabulary (locked)

| Generic | progctf |
|---|---|
| Event | The Voyage / The Hunt |
| Team | Crew |
| Player | Pirate / Sailor |
| Challenge | Island / Treasure |
| Flag | Treasure / Piece |
| Prize | Bounty |
| Hint | Whisper / Log Entry / Map Fragment |
| Scoreboard | The Charts |
| Register | Sign the Articles |
| Easy | The Port |
| Medium | Open Sea |
| Hard | Cursed Depths |
| 1st | Pirate King |
| 2nd | Emperor Yonko |
| 3rd | Warlord of the Sea |

Categories: **Cursed Ports** (Web), **Cipher Cove** (Crypto), **Shipwright's Forge** (Net/Log), **Lighthouse** (Forensics), **Crow's Nest** (OSINT), **Hidden Cargo** (Stego), **Keymaster** (Cracking).

Flag format: `progctf{lowercase_snake_case}` — regex `^progctf\{[a-z0-9_]+\}$`.

## Admin panel — your live override

The Bosun + Helmsman build a real admin panel. While the Voyage is sailing, you (the human operator) can:

- Add a new Island mid-event (publish on the fly)
- Edit a description if a typo confuses Crews
- Disable an Island if it has an unintended solve being abused
- Edit point values
- Force-recalc The Charts
- Ban a Crew that's caught cheating
- Freeze The Voyage (declare it over)
- View every submission attempt with IP + UA for forensic review

Admin role is set in the DB (`pirates.role = 'admin'`) and gates a separate JWT claim. The admin bundle is code-split so non-admins never download it.

## What the swarm produces

```
{repo-root}/
├── backend/              ← Fastify API + WS + scoring + admin
├── frontend/             ← React SPA + admin panel
├── infra/                ← Dockerfiles + K8s + CI/CD + monitoring
├── challenges/           ← 30 Islands organized by category/difficulty
│   ├── cursed_ports/
│   ├── cipher_cove/
│   ├── shipwrights_forge/
│   ├── lighthouse/
│   ├── crows_nest/
│   ├── hidden_cargo/
│   └── keymaster/
├── db/migrations/        ← SQL migrations
├── issues/               ← First Mate's tracked issues
├── SECURITY.md
├── OPERATOR_RUNBOOK.md
└── LAUNCH_SIGNOFF.md     ← First Mate's final go/no-go
```

## When to step in

- **Cartographer's `INDEX.md`** — review the 30 challenge ideas BEFORE Powder Monkey builds. This is the single highest-leverage human review.
- **First Mate's high-severity issues** — these may need your judgment if an agent disputes the fix.
- **Final signoff** — read `LAUNCH_SIGNOFF.md` and the known-issues list before opening registration.

## When NOT to step in

- The Bosun + Helmsman + Shipwright building boilerplate. Let them work.
- Powder Monkey iterating on a vulnerable app to make the intended path work. They'll escalate if stuck.

---

Set sail. ⚓
