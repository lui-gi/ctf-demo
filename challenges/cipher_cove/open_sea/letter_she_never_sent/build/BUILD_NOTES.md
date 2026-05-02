# Build notes — letter_she_never_sent

## Triples (1-indexed page/line/word)

- (1,1,2) → 'tide'
- (1,5,4) → 'moon'
- (2,3,1) → 'salt'
- (2,7,8) → 'keel'
- (3,2,4) → 'deep'
- (3,8,6) → 'sing'
- (4,4,2) → 'wave'
- (5,6,8) → 'hold'
- (6,1,4) → 'bell'

## Passphrase

`tidemoonsaltkeeldeepsingwaveholdbell` (36 chars)

## KDF parameters

- algorithm: PBKDF2-HMAC-SHA256
- salt: b'deadwake-tides'
- iterations: 100000
- dklen: 32 (AES-256 key)

## Audio LSB stride

8 (one bit per 8 samples)

## Coordinate string

`p1l1w2|p1l5w4|p2l3w1|p2l7w8|p3l2w4|p3l8w6|p4l4w2|p5l6w8|p6l1w4||END||`
