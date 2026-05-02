# 004: `staging-internal.marrowtide.example` red herring — production behavior unspecified

**Severity**: low
**Reporter**: First Mate
**Owner**: Shipwright (production), Powder Monkey (documentation)
**Island**: crows_nest/cursed_depths/ghost_fleets_supply_chain (#27)

## Summary

The git host's manifests-cli README references `staging-internal.marrowtide.example` as a real internal host:

> Tests live in `tests/` and run against fixtures from `staging-internal.marrowtide.example` (internal-only host; not reachable from the public network).

The CT log additionally lists `staging-internal.marrowtide.example` as a legitimately issued certificate (id 1008).

This is intentional — it is a documented red herring per `spec.yaml.unintended_solve_traps`:

> The 'staging-internal' subdomain mentioned in git README is a red herring — must serve a 404 or empty page; do NOT contain flag clues.

In the local docker-compose bundle no service is bound to that hostname, so a curious player just gets connection-refused / DNS-fail and moves on quickly. **In production**, however, Shipwright's behavior here is unspecified:

- If `*.marrowtide.example` wildcard DNS resolves but no backend exists, the player sees an upstream-error or a generic load-balancer page that may break theme.
- If DNS does not resolve, the player sees an `NXDOMAIN` which is fine but contradicts the CT log claim that the host exists.
- Worst case: if Shipwright bound a default backend that returned anything other than a clean 404, a player could spend significant time poking at it.

The chain is robust against any of these outcomes, but the failure mode is unspecified in the build artifact. A player chasing this red herring on production could lose 30–60 minutes if the response is ambiguous.

## Reproduction

Static review only — production deploy not yet stood up.

## Recommended fix

Powder Monkey or Shipwright: add an explicit production-deployment note (or a stub nginx in the bundle) that ensures `staging-internal.marrowtide.example` responds with a clean themed 404 — ideally one that says something like:

> Marrowtide internal staging — not reachable from the public network. If you reached this page from outside our private network, please contact security@marrowtide.example.

That leaves the red-herring intent intact (the host exists, but is not the path forward) and rules out the worst-case "player spends an hour fuzzing a probably-empty host" failure mode.

## Verified by

First Mate, 2026-05-01.
