# OPERATOR_RUNBOOK — The Voyage

The on-deck reference for whoever runs **progctf** on event day. Pirate flavor in the
docs is fine; in here we're as plain as a sextant.

---

## Pre-Voyage checklist (T-7 days)

- [ ] Backups: at least 3 nightly Postgres dumps in `s3://progctf-backups/postgres/`. Run the [restore drill](#backups) once on staging and confirm pass.
- [ ] Cert-manager has issued prod TLS for `progctf.deadwake.org` AND wildcard for sandbox subdomains.
- [ ] All 30 Islands have `status: published` in admin. (`/admin/islands` table — every row green.)
- [ ] First Mate's `LAUNCH_SIGNOFF.md` is committed and lists zero `severity: high` issues.
- [ ] Grafana "Voyage Overview" dashboard reachable; `the-voyage.platform`, `.sandboxes`, `.data` PrometheusRule loaded.
- [ ] On-call rotation set in PagerDuty / Discord / wherever. Three names minimum.
- [ ] `OBJECT_STORE_*` secrets rotated within last 30 days.
- [ ] Argon2 pepper (`ARGON2_PEPPER` Secret) NOT rotated since the last `islands.flag_hash` write — rotating it invalidates every flag hash. Confirm and document the current pepper hash digest.

---

## Launching The Voyage (event day, T-0)

Run in this exact order. Each step has a verification command.

### 1. Bring the data tier up

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/network-policies/
kubectl apply -f infra/k8s/postgres/
kubectl apply -f infra/k8s/redis/
kubectl apply -f infra/k8s/minio/
kubectl -n progctf-fleet rollout status statefulset/postgres --timeout=5m
kubectl -n progctf-fleet rollout status deploy/redis --timeout=2m
kubectl -n progctf-fleet rollout status deploy/minio --timeout=2m
```

### 2. Bring the sandbox controller up

```bash
kubectl apply -f infra/k8s/sandbox-controller/
kubectl -n progctf-fleet rollout status deploy/sandbox-controller --timeout=2m
```

### 3. Bring the API + frontend + edge up

```bash
kubectl apply -f infra/k8s/backend/
kubectl apply -f infra/k8s/frontend/
kubectl apply -f infra/k8s/edge/
kubectl -n progctf-fleet rollout status deploy/backend --timeout=5m
kubectl -n progctf-fleet rollout status deploy/frontend --timeout=2m
kubectl -n progctf-fleet rollout status deploy/edge --timeout=2m
```

### 4. Smoke test from outside

```bash
curl -fsS https://progctf.deadwake.org/healthz
curl -fsS https://progctf.deadwake.org/api/charts | jq '.crews | length'   # expect 0 or current count
```

### 5. Open The Voyage to Pirates

Email the announcement. Voyage is live.

---

## Monitoring while The Voyage runs

- **Grafana dashboard:** `https://grafana.internal/d/voyage-overview` — submissions/sec, P95 latency per route, sandbox container count, error-rate, Charts cache age.
- **Prometheus alerts** auto-page via Alertmanager. Anchors below correspond to the `runbook_url` field on each rule.

### #crewisrioting

`CrewIsRiotingBoardingTheAuthEndpoint` — sustained 429s on `/api/auth/*`.

1. `kubectl -n progctf-fleet logs deploy/edge --tail=200 | grep '429.*\\/api\\/auth'` — find offending IP.
2. If single IP: add to edge nginx `deny` block in `infra/nginx/edge.conf` and `kubectl apply` the `edge` configmap.
3. If many IPs: it's credential stuffing. Increase `AUTH_RATE_PER_MIN` rate-limit *down* (yes, down) to `5` via backend ConfigMap, restart backend pods, monitor for 10 min.
4. Forensic: check `submissions` table for the same IPs hitting submission endpoints — coordinated abuse pattern.

### #chartsbecalmed

`ChartsBecalmed` — `progctf_charts_cache_last_write_seconds` hasn't ticked in >10s.

1. `kubectl -n progctf-fleet exec deploy/redis -- redis-cli ping` — confirm Redis alive.
2. `kubectl -n progctf-fleet logs deploy/backend --tail=200 | grep -i 'charts\\|redis'` — look for client errors.
3. If Redis is unhealthy: `kubectl -n progctf-fleet rollout restart deploy/redis`. The Charts cache is non-essential for correctness; brief stalls are tolerable.
4. Force a recompute: `POST /admin/charts/recalc` from the admin panel (or via `kubectl exec deploy/backend -- curl -fsS -X POST -H "Authorization: Bearer $ADMIN_JWT" http://localhost:4000/admin/charts/recalc`).

### #landlubbersubmissions

`LandlubberSubmissionsSpike` — submission rate > 3× the 1h baseline.

1. `psql -c "SELECT crew_id, count(*) FROM submissions WHERE created_at > now() - interval '5 min' GROUP BY 1 ORDER BY 2 DESC LIMIT 10;"` — find the spiking crew.
2. If one Crew is brute-forcing: `POST /admin/crews/<id>/ban` from admin panel. Document in incident log.
3. If broad spike: a popular Island just dropped — tighten `SUBMIT_RATE_PER_MIN` from `5` to `3` via backend ConfigMap if needed.

### #islandsandboxadrift

`IslandSandboxAdrift` — sandbox-controller reports an Island unhealthy >3min.

1. Find the slug from the alert label, then `POST /admin/sandbox/<island_id>/rebuild` from the admin panel.
2. If rebuild fails, `kubectl -n progctf-sandboxes logs -l progctf.deadwake/island-slug=<slug> --tail=100`.
3. If the Island is irrecoverable mid-event, `PATCH /admin/islands/<id>/status status=archived` to remove it from the player view. Announce the archival in the event Discord.

### #backups

`PostgresBackupMissedYesterday` — no successful nightly backup in 26h+.

1. Trigger a manual backup: `kubectl -n progctf-fleet create job --from=cronjob/postgres-backup manual-$(date +%s)`.
2. Watch `kubectl -n progctf-fleet logs job/manual-...` for completion.
3. Confirm artifact landed: `mc ls s3/progctf-backups/postgres/ | tail -3`.
4. Investigate why the CronJob isn't firing — check `kubectl -n progctf-fleet describe cronjob postgres-backup`.

---

## Freezing The Charts (final standings)

When the Voyage is over and you want to compute final standings — submissions stop here.

```bash
# Either from the admin panel — Voyage Controls → "Freeze The Voyage" big red button
# Or programmatically:
ADMIN_JWT=...  # admin login JWT
curl -fsS -X POST -b "progctf_admin=$ADMIN_JWT" https://progctf.deadwake.org/admin/voyage/freeze
```

Verify all clients see the freeze banner ("⚓ The Voyage is frozen.") and `/api/islands/*/submit` returns `423 ERR_VOYAGE_FROZEN`.

`charts.frozen` WS event broadcasts to all clients automatically.

---

## Declaring winners

After freeze, run final-standings recalc and pull the top 3:

```bash
curl -fsS -X POST -b "progctf_admin=$ADMIN_JWT" https://progctf.deadwake.org/admin/charts/recalc
curl -fsS https://progctf.deadwake.org/api/charts | jq '.crews[0:3]'
```

Per spec §11:

- 🥇 **Pirate King** — 1st place Crew
- 🥈 **Emperor Yonko** — 2nd place
- 🥉 **Warlord of the Sea** — 3rd place

Tiebreaker — earliest timestamp of the last scoring submission wins.

```sql
-- Manual tiebreak query — surface this if charts shows tied scores.
SELECT crew_id, max(created_at) AS last_scoring
FROM submissions
WHERE is_correct AND awarded_points > 0
GROUP BY crew_id
ORDER BY last_scoring;
```

---

## Common one-off operations

### Rebuild a single Island sandbox

```bash
ISLAND_ID=...  # from /admin/islands
curl -fsS -X POST -b "progctf_admin=$ADMIN_JWT" "https://progctf.deadwake.org/admin/sandbox/$ISLAND_ID/rebuild"
```

### Ban a Crew or Pirate

Admin panel → Moderation. Or via API:

```bash
curl -fsS -X POST -b "progctf_admin=$ADMIN_JWT" "https://progctf.deadwake.org/admin/crews/<crew_id>/ban"
curl -fsS -X POST -b "progctf_admin=$ADMIN_JWT" "https://progctf.deadwake.org/admin/pirates/<pirate_id>/ban"
```

Audit log entry written automatically.

### Restore from backup

```bash
infra/scripts/restore.sh <backup-key>           # interactive — lists, confirms, applies
# or, fully manual:
mc cp s3/progctf-backups/postgres/<backup>.sql.gz ./b.sql.gz && gunzip ./b.sql.gz
POD=$(kubectl -n progctf-fleet get pod -l app.kubernetes.io/name=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl -n progctf-fleet cp ./b.sql "$POD":/tmp/restore.sql
kubectl -n progctf-fleet exec "$POD" -- psql -U progctf -d progctf -f /tmp/restore.sql
```

---

## Emergency shutdown

If you need The Voyage offline NOW (active intrusion, data exposure, etc.):

```bash
# 1. Freeze submissions immediately.
curl -fsS -X POST -b "progctf_admin=$ADMIN_JWT" https://progctf.deadwake.org/admin/voyage/freeze

# 2. Drop edge ingress (cuts public traffic).
kubectl -n progctf-fleet scale deploy/edge --replicas=0

# 3. (Optional) Snapshot DB before any further investigation.
kubectl -n progctf-fleet create job --from=cronjob/postgres-backup pre-incident-$(date +%s)

# 4. Page on-call + the Quartermaster. Do NOT delete pods or rotate secrets until forensics has a snapshot.
```

To bring it back: scale `edge` back up (`--replicas=2`), then `POST /admin/voyage/unfreeze` once the operator gives the all-clear.
