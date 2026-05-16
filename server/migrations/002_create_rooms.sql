-- Migration 002: Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  capacity  INT NOT NULL CHECK (capacity > 0),
  equipment TEXT,
  location  VARCHAR(255)
);
