CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  public_id   TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('Student', 'Faculty', 'Admin')),
  roll_number TEXT,
  branch      TEXT,
  year        TEXT,
  semester    TEXT,
  grp         TEXT,
  dept        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id         TEXT PRIMARY KEY,
  building   TEXT NOT NULL,
  pos        INT  NOT NULL,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_history (
  id         BIGSERIAL PRIMARY KEY,
  room_id    TEXT NOT NULL,
  item       JSONB NOT NULL,
  relative   BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS status_history_created_idx ON status_history (created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id         BIGSERIAL PRIMARY KEY,
  item       JSONB NOT NULL,
  relative   BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_reads (
  user_id         INT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, notification_id)
);
