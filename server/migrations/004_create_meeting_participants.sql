-- Migration 004: Create meeting_participants table

DO $$ BEGIN
  CREATE TYPE participant_response AS ENUM ('Accepted', 'Declined', 'Tentative');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS meeting_participants (
  id          SERIAL PRIMARY KEY,
  meeting_id  INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id),
  response    participant_response DEFAULT 'Tentative',
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_mp_user ON meeting_participants(user_id);
