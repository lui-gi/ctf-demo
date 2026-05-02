# Whispers — The Drowned Admin

## Whisper 1 (-10%)
The login form is chatty. Try sending it something it isn't expecting in the username field — a single character is enough to make it complain.

## Whisper 2 (-20% cumulative)
The error message names the database. The username field is concatenated directly into a SQL string with no escaping. This is the textbook scenario for *authentication bypass via SQL injection*.

## Whisper 3 (-35% cumulative)
Send a payload in the username field that closes the opening quote, adds a tautology, and comments out the rest of the query — something of the shape `<close-quote> OR <always-true> <comment>`. The exact tautology and the exact comment marker for this DB engine are up to you. Once authenticated, look at the welcome banner.
