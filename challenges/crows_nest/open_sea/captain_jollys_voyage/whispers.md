# Whispers — Captain Jolly's Last Voyage

## Whisper 1 (-10%)
The photograph alone won't pin down the harbor — there are a few visually-similar candidates. Look for a second data source on the site that records something measurable about Jolly's location at a specific time.

## Whisper 2 (-20% cumulative)
Jolly publishes a tide journal as an RSS feed. Cross-reference the most recent tide reading (with its timestamp) against the historical tide archive elsewhere on the site. Only one harbor will match both the tide reading AND the lighthouse visible in the photo.

## Whisper 3 (-35% cumulative)
Pull `/blog/jolly-wexler/tide.rss` for the latest reading and timestamp. Then scan `/charts/tides/<harbor>.csv` for each charted harbor — find the one with a row at exactly that timestamp matching the reported tide value. Confirm by checking the harbor's lighthouse thumbnail matches the one in the photo. The flag is `progctf{<that_harbor_slug>}`.
