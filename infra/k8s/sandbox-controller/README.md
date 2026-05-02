# sandbox-controller — Phase 1 stub, Phase 2 contract

## What ships in Phase 1

A nginx-alpine pod that returns:

- `GET  /healthz`  -> `200 "ok"`  (so Bosun's readiness/liveness probes pass)
- `GET  /metrics`  -> placeholder text (Prometheus scrape target exists)
- `* /...`         -> `501` with a pointer to this file

This is intentional. Bosun's `/admin/sandbox/:id/rebuild` route can wire up
without crashing on a missing upstream, and Powder Monkey can build Islands
locally before the orchestrator is real.

## Phase 2 contract

The real controller (Go, Python, or TS — operator's call) MUST:

### Inputs

- ConfigMaps in `progctf-fleet` labeled `progctf.deadwake/island-config=true`,
  each containing a single `island.yaml` matching
  `infra/island-template/island.yaml.example`.
- Bearer token from `sandbox-controller-token` Secret. Bosun sends the same
  token in `Authorization: Bearer …` on every call (env
  `SANDBOX_CONTROLLER_TOKEN`).

### HTTP API

| Method | Path | Caller | Behavior |
|---|---|---|---|
| POST   | `/sandbox/:island_id/rebuild`           | Bosun admin    | Force re-pull image + roll the Deployment(s) for this Island. For per-Crew Islands, roll every spawned crew instance. |
| POST   | `/sandbox/:island_id/spawn?crew_id=…`   | Bosun frontend | Idempotent. If a per-Crew instance for `crew_id` exists, return its URL; else spawn one and return `{ url, expires_at }`. |
| DELETE | `/sandbox/:island_id/crew/:crew_id`     | Bosun admin    | Tear down a single Crew's instance. |
| GET    | `/sandbox/status`                       | Bosun admin    | Inventory: `[{ island, crew, age_seconds, healthy }]`. |
| GET    | `/healthz`                              | kubelet        | 200 when controller is reconciling. |
| GET    | `/metrics`                              | Prometheus     | Per-Island gauge: `island_sandbox_count{slug,isolation}`, `island_sandbox_unhealthy{slug}`. The `IslandSandboxAdrift` alert reads `island_sandbox_unhealthy > 0 for 3m`. |

### Reconciliation

Every loop tick (15s):

1. List ConfigMaps in `progctf-fleet` carrying island configs.
2. For each `isolation: shared` Island: ensure exactly one
   Deployment + Service in `progctf-sandboxes`. Apply the
   `island-sandbox-allow` NetworkPolicy.
3. For `isolation: per_crew` Islands:
   - Diff existing per-Crew Deployments against last-activity timestamps
     (controller maintains an in-memory map; persists to a Redis key
     for crash recovery).
   - Reap any whose idle age exceeds `ttl_idle_minutes`.
   - Do NOT pre-spawn — the `/spawn` route does it lazily.
4. Apply resource limits from `island.yaml.resources`. Reject
   (with a clear log line) any spec asking for `cpu > 2` or `memory > 2Gi`
   unless the ConfigMap also carries the
   `progctf.deadwake/cursed-depths-resource-override: true` annotation
   set by an admin.
5. Resolve `secret://island-flags/<slug>` env values: read key `<slug>`
   from the `island-flags` Secret in `progctf-sandboxes`.

### Hard rules (audit on every spawn)

- `runAsNonRoot: true`
- `allowPrivilegeEscalation: false`
- `capabilities.drop: [ALL]`
- `seccompProfile.type: RuntimeDefault`
- NetworkPolicy `island-sandbox-allow` attached
- Exactly one container, exactly one port

If any check fails the spawn is rejected and a Prometheus counter
`sandbox_spawn_rejected_total{reason}` is incremented.

## Open questions for Quartermaster

1. Where do per-Crew sandbox URLs live? Recommend
   `https://<voyage>/sandbox/<short_crew_id>/<island_slug>/` proxied by
   the edge nginx; needs a wildcard cert and a small ingress rewrite.
2. Should Cursed Depths Islands sharing infra (e.g. a single auth-required
   admin panel + multiple per-Crew worker nodes) be modeled as one Island
   with sub-pods, or as multiple linked Islands? Defer to Cartographer.
