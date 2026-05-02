# Whispers — The Smuggler's Manifest

## Whisper 1 (-10%)
The endpoint accepts JSON. Send it operator-shaped values, not just plain strings — see what the server does when you hand it `{"$ne": null}` instead of a name.

## Whisper 2 (-20% cumulative)
The backend is MongoDB. The application filters out `hidden:true` documents AFTER the query runs, but Mongo has an operator that's evaluated *during* the query, server-side, and it can reach fields the application thinks it has hidden. Look up Mongo's server-side-JS query operator.

## Whisper 3 (-35% cumulative)
The `$where` operator lets you supply a JavaScript expression evaluated against each document during the query — it sees `this.hidden`, even if the application later tries to filter on it. Combine `$where` with a permissive `name` filter to retrieve the hidden cargo entry. The flag is in the `treasure` field of the single hidden record.
