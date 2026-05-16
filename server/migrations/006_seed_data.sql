-- Migration 006: Seed data
-- Passwords are bcrypt hashes generated for the passwords listed in README
-- Admin@123 => $2a$10$...  |  User@123 => $2a$10$...
-- These hashes are pre-computed for portability

-- ==================== USERS ====================
INSERT INTO users (name, email, password_hash, role, timezone) VALUES
  ('Admin User',     'admin@blaze.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'Asia/Kolkata'),
  ('Alice Johnson',  'alice@blaze.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  'Asia/Kolkata'),
  ('Bob Williams',   'bob@blaze.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  'America/New_York'),
  ('Charlie Brown',  'charlie@blaze.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  'Europe/London'),
  ('Diana Prince',   'diana@blaze.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  'Asia/Kolkata')
ON CONFLICT (email) DO NOTHING;

-- ==================== ROOMS ====================
INSERT INTO rooms (name, capacity, equipment, location) VALUES
  ('Boardroom Alpha',    20, '["Projector", "Whiteboard", "Video Conferencing"]', 'Building A, Floor 3'),
  ('Huddle Room Beta',    6, '["Whiteboard", "TV Screen"]',                       'Building A, Floor 1'),
  ('Conference Room C',  12, '["Projector", "Video Conferencing"]',               'Building B, Floor 2'),
  ('Phone Booth D',       2, '[]',                                                 'Building A, Floor 1'),
  ('Innovation Lab',     30, '["Projector", "Whiteboard", "3D Printer", "VR Setup"]', 'Building C, Floor 1')
ON CONFLICT DO NOTHING;

-- ==================== PAST MEETINGS ====================
-- Meeting 1: A past completed meeting (yesterday)
INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, organizer_id, status, created_at) VALUES
  ('Q2 Planning Review',
   'Review Q2 targets and discuss roadmap adjustments',
   'offline',
   NOW() - INTERVAL '1 day' - INTERVAL '3 hours',
   NOW() - INTERVAL '1 day' - INTERVAL '2 hours',
   1, 1, 'Completed',
   NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Meeting 2: A past online meeting (2 days ago)
INSERT INTO meetings (title, agenda, type, start_time, end_time, online_link, organizer_id, status, created_at) VALUES
  ('Sprint Retrospective',
   'Discuss what went well and areas for improvement',
   'online',
   NOW() - INTERVAL '2 days' - INTERVAL '5 hours',
   NOW() - INTERVAL '2 days' - INTERVAL '4 hours',
   'https://meet.jit.si/blaze-sprint-retro',
   2, 'Completed',
   NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- Meeting 3: A past cancelled meeting (3 days ago)
INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, organizer_id, status, created_at) VALUES
  ('Budget Review Meeting',
   'Annual budget allocation discussion',
   'offline',
   NOW() - INTERVAL '3 days' - INTERVAL '2 hours',
   NOW() - INTERVAL '3 days' - INTERVAL '1 hour',
   3, 1, 'Cancelled',
   NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- ==================== FUTURE MEETINGS ====================
-- Meeting 4: Upcoming meeting (tomorrow)
INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, organizer_id, status, created_at) VALUES
  ('Product Design Sync',
   'Review new UI mockups and gather feedback from the team',
   'offline',
   NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
   NOW() + INTERVAL '1 day' + INTERVAL '3 hours',
   2, 2, 'Scheduled',
   NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Meeting 5: Upcoming online standup (tomorrow morning)
INSERT INTO meetings (title, agenda, type, start_time, end_time, online_link, organizer_id, status, created_at) VALUES
  ('Daily Standup - Engineering',
   'Quick sync on blockers and progress',
   'online',
   NOW() + INTERVAL '1 day' - INTERVAL '4 hours',
   NOW() + INTERVAL '1 day' - INTERVAL '3.5 hours',
   'https://meet.jit.si/blaze-daily-standup',
   1, 'Scheduled',
   NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- Meeting 6: Upcoming meeting (in 2 days)
INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, organizer_id, status, created_at) VALUES
  ('Client Demo - Project Phoenix',
   'Present the MVP to the client stakeholders',
   'offline',
   NOW() + INTERVAL '2 days' + INTERVAL '4 hours',
   NOW() + INTERVAL '2 days' + INTERVAL '6 hours',
   1, 3, 'Scheduled',
   NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Meeting 7: Upcoming meeting (in 3 days)
INSERT INTO meetings (title, agenda, type, start_time, end_time, online_link, organizer_id, status, created_at) VALUES
  ('Architecture Review Board',
   'Evaluate microservice migration proposal and API gateway design',
   'online',
   NOW() + INTERVAL '3 days' + INTERVAL '1 hour',
   NOW() + INTERVAL '3 days' + INTERVAL '2.5 hours',
   'https://meet.jit.si/blaze-arch-review',
   4, 'Scheduled',
   NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Meeting 8: Upcoming meeting (in 5 days)
INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, organizer_id, status, created_at) VALUES
  ('Team Building Workshop',
   'Interactive team exercises and problem-solving activities',
   'offline',
   NOW() + INTERVAL '5 days' + INTERVAL '3 hours',
   NOW() + INTERVAL '5 days' + INTERVAL '5 hours',
   5, 1, 'Scheduled',
   NOW())
ON CONFLICT DO NOTHING;

-- Meeting 9: Draft meeting (in 4 days)
INSERT INTO meetings (title, agenda, type, start_time, end_time, organizer_id, status, created_at) VALUES
  ('Investor Pitch Prep',
   'Prepare and rehearse the Series B pitch deck',
   'online',
   NOW() + INTERVAL '4 days' + INTERVAL '2 hours',
   NOW() + INTERVAL '4 days' + INTERVAL '3 hours',
   5, 'Draft',
   NOW())
ON CONFLICT DO NOTHING;

-- Meeting 10: Upcoming meeting next week
INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, organizer_id, status, created_at) VALUES
  ('All Hands Monthly',
   'Company-wide update from leadership on strategy, hiring, and product',
   'offline',
   NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
   NOW() + INTERVAL '7 days' + INTERVAL '4.5 hours',
   5, 1, 'Scheduled',
   NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ==================== PARTICIPANTS ====================
-- We use subqueries to safely reference meeting ids

-- Meeting 1 participants (Q2 Planning Review)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Q2 Planning Review' LIMIT 1) m,
(VALUES
  ('alice@blaze.com',   'Accepted'::participant_response),
  ('bob@blaze.com',     'Accepted'::participant_response),
  ('diana@blaze.com',   'Accepted'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 2 participants (Sprint Retrospective)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Sprint Retrospective' LIMIT 1) m,
(VALUES
  ('bob@blaze.com',     'Accepted'::participant_response),
  ('charlie@blaze.com', 'Accepted'::participant_response),
  ('admin@blaze.com',   'Declined'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 3 participants (Budget Review - cancelled)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Budget Review Meeting' LIMIT 1) m,
(VALUES
  ('alice@blaze.com',   'Tentative'::participant_response),
  ('diana@blaze.com',   'Tentative'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 4 participants (Product Design Sync)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Product Design Sync' LIMIT 1) m,
(VALUES
  ('admin@blaze.com',   'Accepted'::participant_response),
  ('charlie@blaze.com', 'Tentative'::participant_response),
  ('diana@blaze.com',   'Accepted'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 5 participants (Daily Standup)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Daily Standup - Engineering' LIMIT 1) m,
(VALUES
  ('alice@blaze.com',   'Accepted'::participant_response),
  ('bob@blaze.com',     'Accepted'::participant_response),
  ('charlie@blaze.com', 'Accepted'::participant_response),
  ('diana@blaze.com',   'Accepted'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 6 participants (Client Demo)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Client Demo - Project Phoenix' LIMIT 1) m,
(VALUES
  ('admin@blaze.com',   'Accepted'::participant_response),
  ('alice@blaze.com',   'Accepted'::participant_response),
  ('diana@blaze.com',   'Tentative'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 7 participants (Architecture Review Board)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Architecture Review Board' LIMIT 1) m,
(VALUES
  ('admin@blaze.com',   'Accepted'::participant_response),
  ('bob@blaze.com',     'Accepted'::participant_response),
  ('alice@blaze.com',   'Tentative'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 8 participants (Team Building Workshop)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Team Building Workshop' LIMIT 1) m,
(VALUES
  ('alice@blaze.com',   'Accepted'::participant_response),
  ('bob@blaze.com',     'Accepted'::participant_response),
  ('charlie@blaze.com', 'Accepted'::participant_response),
  ('diana@blaze.com',   'Accepted'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 9 participants (Investor Pitch Prep)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'Investor Pitch Prep' LIMIT 1) m,
(VALUES
  ('alice@blaze.com',   'Tentative'::participant_response),
  ('bob@blaze.com',     'Tentative'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- Meeting 10 participants (All Hands Monthly)
INSERT INTO meeting_participants (meeting_id, user_id, response)
SELECT m.id, u.id, r.resp
FROM (SELECT id FROM meetings WHERE title = 'All Hands Monthly' LIMIT 1) m,
(VALUES
  ('alice@blaze.com',   'Accepted'::participant_response),
  ('bob@blaze.com',     'Accepted'::participant_response),
  ('charlie@blaze.com', 'Accepted'::participant_response),
  ('diana@blaze.com',   'Accepted'::participant_response)
) AS r(email, resp)
JOIN users u ON u.email = r.email
ON CONFLICT DO NOTHING;

-- ==================== STATUS LOG ====================
-- Log entries for meetings that had status transitions

-- Q2 Planning Review: Draft -> Scheduled -> Completed
INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Draft'::meeting_status, 'Scheduled'::meeting_status, 1, NOW() - INTERVAL '3 days', 'Meeting confirmed with all participants'
FROM meetings m WHERE m.title = 'Q2 Planning Review' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Scheduled'::meeting_status, 'Completed'::meeting_status, 1, NOW() - INTERVAL '1 day', 'Meeting completed successfully'
FROM meetings m WHERE m.title = 'Q2 Planning Review' LIMIT 1
ON CONFLICT DO NOTHING;

-- Sprint Retrospective: Draft -> Scheduled -> Completed
INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Draft'::meeting_status, 'Scheduled'::meeting_status, 2, NOW() - INTERVAL '4 days', NULL
FROM meetings m WHERE m.title = 'Sprint Retrospective' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Scheduled'::meeting_status, 'Completed'::meeting_status, 2, NOW() - INTERVAL '2 days', NULL
FROM meetings m WHERE m.title = 'Sprint Retrospective' LIMIT 1
ON CONFLICT DO NOTHING;

-- Budget Review: Draft -> Scheduled -> Cancelled
INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Draft'::meeting_status, 'Scheduled'::meeting_status, 1, NOW() - INTERVAL '5 days', NULL
FROM meetings m WHERE m.title = 'Budget Review Meeting' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Scheduled'::meeting_status, 'Cancelled'::meeting_status, 1, NOW() - INTERVAL '3 days', 'Postponed to next quarter due to pending audit'
FROM meetings m WHERE m.title = 'Budget Review Meeting' LIMIT 1
ON CONFLICT DO NOTHING;

-- Future meetings: Draft -> Scheduled
INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, changed_at, reason)
SELECT m.id, 'Draft'::meeting_status, 'Scheduled'::meeting_status, m.organizer_id, m.created_at, 'Meeting scheduled'
FROM meetings m WHERE m.status = 'Scheduled' AND m.start_time > NOW()
ON CONFLICT DO NOTHING;
