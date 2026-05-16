-- Migration 003: Create meetings table

-- Create enum types if they don't exist
DO $$ BEGIN
  CREATE TYPE meeting_type AS ENUM ('online', 'offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE meeting_status AS ENUM ('Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS meetings (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL CHECK (char_length(title) >= 3),
  agenda          TEXT,
  type            meeting_type NOT NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  room_id         INT REFERENCES rooms(id),
  online_link     TEXT,
  organizer_id    INT NOT NULL REFERENCES users(id),
  status          meeting_status DEFAULT 'Draft',
  recurrence      VARCHAR(20) DEFAULT NULL CHECK (recurrence IN (NULL, 'daily', 'weekly', 'monthly')),
  recurrence_end  DATE,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_time ON meetings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_meetings_room ON meetings(room_id);
