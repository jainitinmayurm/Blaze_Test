-- Migration 005: Create meeting_status_log table
CREATE TABLE IF NOT EXISTS meeting_status_log (
  id          SERIAL PRIMARY KEY,
  meeting_id  INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  from_status meeting_status,
  to_status   meeting_status NOT NULL,
  changed_by  INT NOT NULL REFERENCES users(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  reason      TEXT
);

CREATE INDEX IF NOT EXISTS idx_msl_meeting ON meeting_status_log(meeting_id);
