-- progctf — initial schema
-- Per spec §2. All UUIDs require pgcrypto for gen_random_uuid().

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crews must be created before pirates because pirates.crew_id references crews(id).
CREATE TABLE IF NOT EXISTS crews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT UNIQUE NOT NULL,
  flag_emoji   TEXT,
  invite_code  TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  banned_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS crews_invite_code_idx ON crews (invite_code);

CREATE TABLE IF NOT EXISTS pirates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  handle         TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,                          -- argon2id
  crew_id        UUID REFERENCES crews(id) ON DELETE SET NULL,
  role           TEXT NOT NULL DEFAULT 'pirate',         -- pirate | admin
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  banned_at      TIMESTAMPTZ,
  CONSTRAINT pirates_role_chk CHECK (role IN ('pirate', 'admin'))
);

CREATE INDEX IF NOT EXISTS pirates_crew_idx ON pirates (crew_id);

CREATE TABLE IF NOT EXISTS islands (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,
  difficulty        TEXT NOT NULL,
  description_md    TEXT NOT NULL,
  base_points       INT  NOT NULL,
  current_points    INT  NOT NULL,
  flag_hash         TEXT NOT NULL,                       -- argon2id of canonical flag
  files_url         TEXT,
  sandbox_image     TEXT,
  status            TEXT NOT NULL DEFAULT 'draft',       -- draft | published | archived
  first_blood_crew  UUID REFERENCES crews(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT islands_difficulty_chk CHECK (difficulty IN ('port', 'open_sea', 'cursed_depths')),
  CONSTRAINT islands_status_chk     CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT islands_category_chk   CHECK (category IN (
    'cursed_ports', 'cipher_cove', 'shipwrights_forge',
    'lighthouse', 'crows_nest', 'hidden_cargo', 'keymaster'
  ))
);

CREATE INDEX IF NOT EXISTS islands_status_idx     ON islands (status);
CREATE INDEX IF NOT EXISTS islands_difficulty_idx ON islands (difficulty);
CREATE INDEX IF NOT EXISTS islands_category_idx   ON islands (category);

CREATE TABLE IF NOT EXISTS whispers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  island_id    UUID NOT NULL REFERENCES islands(id) ON DELETE CASCADE,
  ordinal      INT  NOT NULL,
  body_md      TEXT NOT NULL,
  cost_points  INT  NOT NULL DEFAULT 0,
  CONSTRAINT whispers_ordinal_chk CHECK (ordinal BETWEEN 1 AND 3),
  UNIQUE (island_id, ordinal)
);

CREATE INDEX IF NOT EXISTS whispers_island_idx ON whispers (island_id);

CREATE TABLE IF NOT EXISTS submissions (
  id              BIGSERIAL PRIMARY KEY,
  pirate_id       UUID REFERENCES pirates(id) ON DELETE SET NULL,
  crew_id         UUID REFERENCES crews(id)   ON DELETE SET NULL,
  island_id       UUID REFERENCES islands(id) ON DELETE SET NULL,
  submitted       TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  awarded_points  INT NOT NULL DEFAULT 0,
  ip              INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submissions_crew_island_idx ON submissions (crew_id, island_id);
CREATE INDEX IF NOT EXISTS submissions_created_at_idx  ON submissions (created_at);
CREATE INDEX IF NOT EXISTS submissions_correct_idx     ON submissions (is_correct) WHERE is_correct = true;

-- One canonical "the crew solved island X" lookup. Partial unique index on correct rows.
CREATE UNIQUE INDEX IF NOT EXISTS submissions_crew_island_correct_uniq
  ON submissions (crew_id, island_id) WHERE is_correct = true;

CREATE TABLE IF NOT EXISTS whisper_reveals (
  crew_id     UUID NOT NULL REFERENCES crews(id)    ON DELETE CASCADE,
  whisper_id  UUID NOT NULL REFERENCES whispers(id) ON DELETE CASCADE,
  cost_paid   INT  NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (crew_id, whisper_id)
);

CREATE INDEX IF NOT EXISTS whisper_reveals_crew_idx ON whisper_reveals (crew_id);
