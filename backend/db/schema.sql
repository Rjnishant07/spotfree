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

-- One active login code per email (hashed, single use, attempt-limited). Lives in the DB so limits
-- survive restarts and work across several server instances.
CREATE TABLE IF NOT EXISTS login_codes (
  email      TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count        INT NOT NULL DEFAULT 0
);


CREATE TABLE IF NOT EXISTS room_issues (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT room_issue_category_check CHECK (category IN ('AC','Projector','Lights','Furniture','Cleanliness','Network','Other')),
  CONSTRAINT room_issue_priority_check CHECK (priority IN ('Low','Normal','High','Urgent')),
  CONSTRAINT room_issue_status_check CHECK (status IN ('Open','In Progress','Resolved'))
);
CREATE INDEX IF NOT EXISTS room_issues_room_idx ON room_issues (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS room_issues_status_idx ON room_issues (status, created_at DESC);
