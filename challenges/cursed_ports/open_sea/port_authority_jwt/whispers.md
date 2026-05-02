# Whispers — Port Authority Pass

## Whisper 1 (-10%)
The token you receive is a JWT signed with a symmetric algorithm. To forge one, you need the signing secret. Look around the deployment for source-disclosure footguns — common ones are version control directories.

## Whisper 2 (-20% cumulative)
The `.git/` directory is served from the deployment root. Use `git-dumper` (or your own fetcher) to reconstruct the repo locally, then walk the commit history. The secret was committed once and "removed" later — but git remembers everything.

## Whisper 3 (-35% cumulative)
After recovering the secret from a parent commit, sign a new JWT with `is_harbormaster: true` using HS256 and the recovered secret. Send that as your Bearer token to `/admin/logbook` and read the banner. Final 20%: figure out which commit holds the secret and what the exact payload field name is.
