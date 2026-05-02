# SECURITY — Threat Model for the progctf Platform

This is the threat model for the **platform itself**, not for the Islands (every Island
intentionally contains a vulnerability — that's the point of a CTF). The Islands are
sandboxed; this doc is about keeping the platform around them honest.

---

## Assets

| # | Asset | Why it matters |
|---|-------|----------------|
| A1 | **Canonical flag plaintexts** (in Cartographer's `flag.txt` files + injected at deploy time as Secrets) | If leaked, every Island is solvable trivially. Game over. |
| A2 | **`flag_hash` column** in `islands` table | argon2id-hashed; combined with the global `ARGON2_PEPPER` Secret. Compromise of both means offline brute-forcing of well-formed candidates. |
| A3 | **`pirates.password_hash`** | argon2id; user-provided passwords. Standard credential exposure risk. |
| A4 | **JWT signing secret** (`JWT_SECRET`) | Forging this lets an attacker impersonate any Pirate or escalate to admin. |
| A5 | **`ARGON2_PEPPER`** | Without it, an attacker with `flag_hash` cannot mount an offline candidate-test attack against well-formed flags. |
| A6 | **Admin pirate accounts** | Hold the freeze switch + ban controls + flag editing. |
| A7 | **`submissions` table** | Audit trail. Tamper or wipe → can't reconstruct who solved what + can't catch cheating. |
| A8 | **`OBJECT_STORE_*` credentials** | Backup tampering, challenge-file substitution. |
| A9 | **Sandbox-controller bearer token** (`SANDBOX_CONTROLLER_TOKEN`) | Lets the holder spawn / kill / rebuild any Island sandbox. |
| A10 | **Backups** in object storage | Recovery from a destructive incident; integrity matters. |

---

## Threat actors

| Actor | Capability | Motivation |
|-------|-----------|------------|
| **Cheating Crew** (player with valid account) | Submits flags via API; can read all published Island descriptions; can probe their own crew's data | Win the Bounty without doing the work |
| **External attacker** (no account) | Hits the public edge; may try credential stuffing, registration abuse, DDoS | Defacement, doxing players, trophy |
| **Compromised Pirate account** (account takeover) | Same as Cheating Crew, plus can join other Crews via leaked invite codes | Cheat or harass on someone else's behalf |
| **Compromised admin account** | Full Admin API; can edit flags, freeze/unfreeze, ban Crews, view submission log | Catastrophic — could rewrite history mid-event |
| **Compromised insider** (Deadwake org member with infra access) | Direct K8s / DB / object-storage access | Out of scope for this doc — handled by infra ACLs |

---

## Controls (mapped to assets + threats)

### Cryptographic controls

- **C1 — Argon2id everywhere passwords / flags are at rest.** Params m=64MB, t=3, p=4 for flags (heavier); p=4 default for passwords. (`backend/src/services/validator.ts:FLAG_ARGON_OPTS`, `backend/src/auth/passwords.ts`.) Defends A1, A2, A3.
- **C2 — Constant-time compare on flag verify.** `crypto.timingSafeEqual` second-stage guard on a derived digest, after argon2 verify. Eliminates timing oracles. Defends against Cheating Crew probing for partial flag matches.
- **C3 — Global pepper `ARGON2_PEPPER`** mixed into every flag hash. Means a leaked DB without the K8s Secret is not offline-crackable for well-formed flag candidates. Defends A1, A2.
- **C4 — JWT signing key rotated quarterly** + on every suspected compromise. Defends A4. Rotation procedure: update `JWT_SECRET` Secret → restart backend → all sessions invalidated, players re-board.

### Authentication / authorization

- **C5 — Admin role gated at the prefix-level preHandler** (`backend/src/routes/admin/index.ts:23`). Every admin endpoint inherits the gate; no possibility of forgetting it on a single route. Defends A6.
- **C6 — Admin uses a separate cookie** (`progctf_admin`). Prevents accidental privilege carryover from the player session. Defends A6.
- **C7 — JWT lives in httpOnly + sameSite=Lax cookie**, never in response body, never readable from JS. Mitigates XSS-driven session theft. Defends A3, A6.
- **C8 — Refresh-token flow** with shorter access-token TTL (8h) so a stolen access token has bounded lifetime.

### Rate limiting

- **C9 — `/api/auth/board`: 10/min/IP.** Defends against credential stuffing. Surfaced by `CrewIsRiotingBoardingTheAuthEndpoint` Prometheus alert.
- **C10 — `/api/islands/:slug/submit`: 5/min/Crew/Island.** Defends against flag brute-force. Returns `429 + Retry-After`. Frontend renders a themed cooldown.
- **C11 — Cloudflare / edge nginx rate limit** at the perimeter for blanket DDoS handling.

### Input validation

- **C12 — Flag format regex check BEFORE any hash work** (`^progctf\{[a-z0-9_]+\}$`). Saves CPU on garbage submissions and limits the input shape.
- **C13 — DOMPurify + rehype-sanitize on all markdown** rendered in descriptions and Whispers. Strips `<script>`, `onerror`, `javascript:` URIs, `<iframe>`. Tested. Defends A6 from a compromised admin attempting to plant XSS in Island descriptions.
- **C14 — Strict CSP** in `frontend/index.html` meta tag: no inline JS, no `unsafe-eval`, scripts/styles self-only, frame-src self-only. Defends against most XSS classes.

### Audit + observability

- **C15 — Every flag submission logged** to `submissions` (correct or not) with IP + UA + raw text. Defends A7 — forensics can reconstruct cheating patterns post-incident.
- **C16 — Every admin mutation audit-logged** to `audit_log` with `admin_pirate_id, action, target_id, payload_json, ip, user_agent`. Defends A6 — compromised-admin actions are reconstructable.
- **C17 — Prometheus alerts** for anomaly detection (`LandlubberSubmissionsSpike`, `CrewIsRiotingBoardingTheAuthEndpoint`, `BackendErrorRate`, `BackendHighLatencyP95`). See `OPERATOR_RUNBOOK.md` for response.

### Sandbox isolation

- **C18 — `island-sandbox-allow` NetworkPolicy** denies egress to public internet from every Island sandbox. Means an Island's intentional vulnerability cannot be used as a pivot to attack the platform or external systems. CI gate (`network-policies` job in `ci.yml`) refuses any merge that loosens this.
- **C19 — All sandbox containers: `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, drop `ALL` caps, `seccompProfile: RuntimeDefault`, `readOnlyRootFilesystem: true` where compatible.** Defends host kernel / sibling pods from sandbox escapes.
- **C20 — Per-Crew isolation** for hosted Cursed Ports challenges via the sandbox-controller. Means one Crew's malicious behavior in their sandbox cannot affect another Crew's instance. (Important for Islands like `kraken_in_the_manifest` where prototype pollution persists in the Node.js process.)

### Backups + recovery

- **C21 — Nightly Postgres backup** to object storage with 14-day lifecycle. Defends A10 against tampering / accidental deletion.
- **C22 — Weekly restore drill** (`backup-restore-drill.yml` GH Action). Catches silent corruption before The Voyage day.
- **C23 — Object-storage signed URLs only** for challenge files; no public buckets.

### Secrets management

- **C24 — All secrets via K8s `Secret`** (or sealed-secrets in repo). `.env.example` files only in source control. CI grep-gate against committed secrets.
- **C25 — `:latest` image tags forbidden in K8s manifests.** CI gate. Forces image pinning and reproducible deploys.

---

## Escalation path

1. **L1 — On-call engineer** (rotation in PagerDuty). First responder for any Prometheus page.
2. **L2 — Platform lead (Bosun's deputy)** — if L1 can't resolve in 30 min, or if the incident touches data/auth/sandbox controls.
3. **L3 — Quartermaster** — for any incident requiring an event-wide decision (freeze, voyage-cancel, public statement).
4. **External: report channels for vulnerability reports** — see "Reporting vulnerabilities" below.

---

## Incident response checklist

When a credible incident is suspected — flag exposure, admin compromise, mass cheating, sandbox escape — work this list in order. Don't skip steps.

```
[ ] 1. FREEZE THE VOYAGE.
       POST /admin/voyage/freeze
       — stops further submissions immediately. Trivially reversible.

[ ] 2. SNAPSHOT.
       Manual backup: kubectl create job --from=cronjob/postgres-backup pre-incident-$(date +%s)
       — gives forensics a known-good baseline before any cleanup.

[ ] 3. PRESERVE EVIDENCE.
       Do NOT delete pods, rotate JWT_SECRET, or wipe Redis until forensics has snapshots:
         - kubectl logs --tail=10000 of every relevant pod -> ./incident-logs/
         - Postgres dump (step 2 covers this)
         - Redis SAVE then BGSAVE; copy /data/dump.rdb out

[ ] 4. SCOPE.
       Query submissions + audit_log for the relevant time window.
         psql -c "SELECT * FROM audit_log WHERE created_at > now() - interval '24 hours' ORDER BY created_at DESC LIMIT 200;"
         psql -c "SELECT * FROM submissions WHERE created_at > now() - interval '24 hours' ORDER BY created_at DESC LIMIT 500;"
       Identify which Pirates/Crews are involved. Compromised admin? Check audit_log for actions you didn't make.

[ ] 5. CONTAIN.
       - Compromised pirate/admin: ban via /admin/{pirates,crews}/<id>/ban
       - Suspected JWT_SECRET leak: rotate the Secret, restart backend (every active session invalidated)
       - Suspected flag plaintext leak: pick the affected Island(s); /admin/islands/<id>/status archived; rotate the canonical flag in flag.txt; re-hash via /admin/islands/<id> PATCH
       - Sandbox escape: scale sandbox-controller to 0; tear down the affected Island's per-Crew instances

[ ] 6. COMMUNICATE.
       - Quartermaster posts status to event Discord/announcement channel (terse, factual).
       - If player data potentially exposed: prepare a separate disclosure with the legal/comms lead.

[ ] 7. RESTORE.
       Once contained:
         POST /admin/voyage/unfreeze
       Validate that a smoke submission works end-to-end before announcing.

[ ] 8. POSTMORTEM.
       Within 7 days. File issue under /issues/ with:
         - Timeline (timestamps from logs)
         - Root cause
         - What worked / what didn't in this checklist
         - Concrete control changes (file PRs against this doc)
```

---

## Reporting vulnerabilities

Found a vulnerability in the **platform itself** (not in an Island — those are intentional)?

- Email: `security@deadwake.org` (PGP key in `.well-known/security.txt`)
- 90-day responsible-disclosure window. We'll credit you in the event recap unless you prefer otherwise.
- **Out-of-scope:** the intentional vulnerabilities inside Islands. If you find one bypassing the sandbox isolation though, that IS in scope — report it.
