-- ==============================================================================
-- Blaze Meeting Booking System - Database Schema
-- Run this file to create all tables and necessary types for the system.
-- ==============================================================================

-- 1. Create ENUM types
DO $$ BEGIN
  CREATE TYPE meeting_type AS ENUM ('online', 'offline');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE meeting_status AS ENUM ('Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE participant_response AS ENUM ('Accepted', 'Declined', 'Tentative');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  timezone      VARCHAR(50) DEFAULT 'UTC',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- 3. Create Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  capacity  INT NOT NULL CHECK (capacity > 0),
  equipment TEXT,
  location  VARCHAR(255)
);


-- 4. Create Meetings Table
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


-- 5. Create Meeting Participants Junction Table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id          SERIAL PRIMARY KEY,
  meeting_id  INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id),
  response    participant_response DEFAULT 'Tentative',
  UNIQUE(meeting_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_mp_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_mp_user ON meeting_participants(user_id);


-- 6. Create Meeting Status Log Table (Audit Trail)
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

-- ==============================================================================
-- Schema Creation Complete. 
-- Seed data can be found in server/migrations/006_seed_data.sql
-- ==============================================================================
