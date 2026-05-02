# Whispers — Kraken in the Manifest

## Whisper 1 (-10%)
The PATCH endpoint accepts arbitrary nested JSON and merges it recursively into the stored quote. There's no allowlist on the keys. Think about what JavaScript objects all share by inheritance.

## Whisper 2 (-20% cumulative)
This is a prototype-pollution to server-side-template-injection chain. The bill-of-lading is rendered with EJS. EJS's `render()` accepts internal options that, if not present on the explicit options object, are looked up via the prototype chain. Polluting one of those options gives you template execution. Look at EJS's source for which options it checks.

## Whisper 3 (-35% cumulative)
EJS reads several option names off its options object during rendering — `escapeFunction`, `outputFunctionName`, and `compileDebug` are good candidates. Pollute `Object.prototype.escapeFunction` with a function source-string that runs arbitrary code, then trigger render. The classic gadget reads `/treasure` via `child_process`. Final 20%: getting the EXACT pollution payload syntax right (it's stricter than most online writeups suggest) and identifying which gadget your specific EJS version actually invokes.
