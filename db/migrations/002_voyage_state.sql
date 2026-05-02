-- progctf — voyage state + admin audit log

-- Singleton row holding global voyage freeze state.
-- A single row is enforced via a unique partial index on a constant column.
CREATE TABLE IF NOT EXISTS voyage_state (
  id          INT PRIMARY KEY DEFAULT 1,
  frozen      BOOLEAN NOT NULL DEFAULT false,
  frozen_at   TIMESTAMPTZ,
  unfrozen_at TIMESTAMPTZ,
  CONSTRAINT voyage_state_singleton CHECK (id = 1)
);

INSERT INTO voyage_state (id, frozen) VALUES (1, false)
  ON CONFLICT (id) DO NOTHING;

-- Audit trail of every admin mutation.
CREATE TABLE IF NOT EXISTS audit_log (
  id               BIGSERIAL PRIMARY KEY,
  admin_pirate_id  UUID REFERENCES pirates(id) ON DELETE SET NULL,
  action           TEXT NOT NULL,                         -- e.g. island.create, crew.ban
  target_id        TEXT,                                  -- UUID or arbitrary identifier
  payload_json     JSONB,
  ip               INET,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_admin_idx      ON audit_log (admin_pirate_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx     ON audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at);
