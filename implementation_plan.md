# Meeting Slot Booking System — Implementation Plan

## Overview

A standalone, full-stack **Meeting Slot Booking System** built for a hackathon. Users can create, schedule, reschedule, and cancel meetings with real-time conflict detection for both participants and rooms. The system supports online and offline meeting types, a rich calendar dashboard, and admin room management.

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL (via `pg` driver + raw SQL migrations) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Secrets | `.env` files (dotenv) |
| Time | All stored in UTC; rendered in user's local timezone via `Intl` / `dayjs` |

---

## User Review Required

> [!IMPORTANT]
> **Database choice**: This plan uses **PostgreSQL**. If you prefer MySQL, let me know before I begin — the SQL dialect will change slightly.

> [!IMPORTANT]
> **Email invites (bonus)**: The plan uses **Nodemailer** with a Gmail App Password or Ethereal (test SMTP). You'll need to provide SMTP credentials in `.env` to enable real email. For demo, Ethereal fake SMTP will work out of the box.

> [!WARNING]
> **No external OAuth**: Authentication is fully self-contained (email + password with JWT). There is no Google/Microsoft SSO — this keeps the module standalone with zero external dependencies.

---

## Open Questions

> [!NOTE]
> 1. **Seed data**: Should I pre-seed the DB with demo users, rooms, and sample meetings for easy grading/demo?  
> 2. **Admin role**: Is there a separate admin registration flow, or should one user be flagged as admin via a seed script?  
> 3. **Port preferences**: Default plan is backend on `:5000`, frontend on `:5173`. Any conflicts?

---

## Project Structure

```
Blaze_Test/
├── server/                       # Express backend
│   ├── .env                      # DB, JWT, SMTP secrets
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── config/
│   │   │   └── db.js             # PG pool
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verify
│   │   │   ├── adminOnly.js      # Role guard
│   │   │   └── validate.js       # express-validator runner
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── meeting.routes.js
│   │   │   ├── room.routes.js
│   │   │   ├── availability.routes.js
│   │   │   └── calendar.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── meeting.controller.js
│   │   │   ├── room.controller.js
│   │   │   ├── availability.controller.js
│   │   │   └── calendar.controller.js
│   │   ├── services/
│   │   │   ├── conflict.service.js    # Core conflict logic
│   │   │   ├── meeting.service.js
│   │   │   ├── recurring.service.js   # Bonus: recurring expansion
│   │   │   ├── email.service.js       # Bonus: .ics invites
│   │   │   └── reminder.service.js    # Bonus: 10-min reminder
│   │   ├── validators/
│   │   │   ├── meeting.validator.js
│   │   │   └── room.validator.js
│   │   └── utils/
│   │       ├── ics.js                 # .ics file builder
│   │       └── jitsi.js               # Auto Jitsi link
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_rooms.sql
│   │   ├── 003_create_meetings.sql
│   │   ├── 004_create_meeting_participants.sql
│   │   ├── 005_create_meeting_status_log.sql
│   │   └── 006_seed_data.sql
│   └── postman/
│       └── MeetingSlotBooking.postman_collection.json
│
├── client/                       # React + Vite frontend
│   ├── .env                      # VITE_API_URL
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css             # Global design system
│       ├── api/
│       │   └── client.js         # Axios instance with JWT interceptor
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useMeetings.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── CalendarDashboard.jsx
│       │   ├── CreateMeeting.jsx
│       │   ├── MeetingDetail.jsx
│       │   ├── MyMeetings.jsx
│       │   ├── RoomManagement.jsx
│       │   └── Reports.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── CalendarView.jsx      # Day/Week/Month
│       │   ├── SlotPicker.jsx
│       │   ├── MeetingForm.jsx
│       │   ├── ParticipantSelector.jsx
│       │   ├── MeetingCard.jsx
│       │   ├── StatusBadge.jsx
│       │   ├── RoomCard.jsx
│       │   └── Charts.jsx           # Reports charts
│       └── utils/
│           └── time.js              # dayjs UTC ↔ local helpers
│
└── README.md
```

---

## Proposed Changes

### 1. Database Schema & Migrations

> All times stored as `TIMESTAMPTZ` (UTC). IDs are auto-incrementing integers.

#### [NEW] [001_create_users.sql](file:///c:/JAI NIITIN MAYUR M/CODIN/Blaze_Test/server/migrations/001_create_users.sql)

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin')),
  timezone      VARCHAR(50) DEFAULT 'UTC',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### [NEW] [002_create_rooms.sql](file:///c:/JAI NIITIN MAYUR M/CODIN/Blaze_Test/server/migrations/002_create_rooms.sql)

```sql
CREATE TABLE rooms (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  capacity  INT NOT NULL CHECK (capacity > 0),
  equipment TEXT,          -- JSON string: ["Projector","Whiteboard"]
  location  VARCHAR(255)
);
```

#### [NEW] [003_create_meetings.sql](file:///c:/JAI NIITIN MAYUR M/CODIN/Blaze_Test/server/migrations/003_create_meetings.sql)

```sql
CREATE TYPE meeting_type   AS ENUM ('online','offline');
CREATE TYPE meeting_status AS ENUM ('Draft','Scheduled','In Progress','Completed','Cancelled');

CREATE TABLE meetings (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL CHECK (char_length(title) >= 3),
  agenda        TEXT,
  type          meeting_type NOT NULL,
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  room_id       INT REFERENCES rooms(id),
  online_link   TEXT,
  organizer_id  INT NOT NULL REFERENCES users(id),
  status        meeting_status DEFAULT 'Draft',
  recurrence    VARCHAR(20) DEFAULT NULL CHECK (recurrence IN (NULL,'daily','weekly','monthly')),
  recurrence_end DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time CHECK (start_time < end_time)
);
```

#### [NEW] [004_create_meeting_participants.sql](file:///c:/JAI NIITIN MAYUR M/CODIN/Blaze_Test/server/migrations/004_create_meeting_participants.sql)

```sql
CREATE TYPE participant_response AS ENUM ('Accepted','Declined','Tentative');

CREATE TABLE meeting_participants (
  id          SERIAL PRIMARY KEY,
  meeting_id  INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id),
  response    participant_response DEFAULT 'Tentative',
  UNIQUE(meeting_id, user_id)
);
```

#### [NEW] [005_create_meeting_status_log.sql](file:///c:/JAI NIITIN MAYUR M/CODIN/Blaze_Test/server/migrations/005_create_meeting_status_log.sql)

```sql
CREATE TABLE meeting_status_log (
  id          SERIAL PRIMARY KEY,
  meeting_id  INT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  from_status meeting_status,
  to_status   meeting_status NOT NULL,
  changed_by  INT NOT NULL REFERENCES users(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  reason      TEXT
);
```

#### [NEW] [006_seed_data.sql](file:///c:/JAI NIITIN MAYUR M/CODIN/Blaze_Test/server/migrations/006_seed_data.sql)

Pre-seeds:
- 1 admin user (`admin@blaze.com` / `Admin@123`)
- 4 regular users
- 3 meeting rooms with varying capacities
- 2 sample meetings with participants

---

### 2. Backend — Express Server

#### Core Server Setup

| File | Purpose |
|------|---------|
| [NEW] `server/src/index.js` | Express app, CORS, JSON parser, route mounting, migration runner on startup |
| [NEW] `server/src/config/db.js` | PG Pool from `DATABASE_URL` env var |
| [NEW] `server/.env` | `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SMTP_*` vars |

#### Authentication

| File | Purpose |
|------|---------|
| [NEW] `auth.routes.js` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| [NEW] `auth.controller.js` | bcrypt hash, JWT sign/verify, return user profile |
| [NEW] `auth.js` middleware | Extract & verify `Bearer` token, attach `req.user` |
| [NEW] `adminOnly.js` middleware | Check `req.user.role === 'admin'` |

#### Meeting CRUD + Conflict Logic

| Endpoint | Handler | Key Validations (all server-side) |
|----------|---------|----------------------------------|
| `POST /api/meetings` | `createMeeting` | Title ≥ 3 chars, start in future, start < end, ≥ 1 participant (excl. organizer), participant conflict check, room conflict + capacity check (offline), online link required for Scheduled online meetings, auto-generate Jitsi link if empty |
| `GET /api/meetings` | `listMeetings` | Filters: `status`, `type`, `from`, `to`, `organizer_id` |
| `GET /api/meetings/:id` | `getMeeting` | Returns full meeting with participants, room, organizer, status log |
| `PUT /api/meetings/:id` | `updateMeeting` | Re-runs ALL conflict checks. Logs status change if status changed. |
| `DELETE /api/meetings/:id` | `cancelMeeting` | Soft-delete → `status = 'Cancelled'`. Logs to `meeting_status_log`. |

**Conflict Detection Algorithm** (`conflict.service.js`):

```
checkParticipantConflicts(participantIds[], startTime, endTime, excludeMeetingId?)
  → SELECT from meetings JOIN meeting_participants
    WHERE user_id IN (...) AND status NOT IN ('Cancelled')
    AND tstzrange(start_time, end_time) && tstzrange($start, $end)
    AND id != $excludeMeetingId
  → Returns list of conflicting meetings or empty

checkRoomConflict(roomId, startTime, endTime, participantCount, excludeMeetingId?)
  → Check room exists AND capacity >= participantCount
  → Check no overlapping non-cancelled meeting uses the same room
```

#### Availability API

| Endpoint | Handler |
|----------|---------|
| `GET /api/availability?participants=1,2,3&date=2026-05-20&room_id=1` | Scans the given date (00:00–23:59 UTC), finds all booked slots per participant (+ room), returns free 30-minute windows |

#### Room Management

| Endpoint | Handler |
|----------|---------|
| `GET /api/rooms` | List all rooms (public) |
| `POST /api/rooms` | Create room (admin only) |
| `PUT /api/rooms/:id` | Edit room (admin only) |

#### Calendar Feed

| Endpoint | Handler |
|----------|---------|
| `GET /api/calendar?from=&to=` | Returns meetings in the date range for the logged-in user (as organizer or participant) |

#### Reports

| Endpoint | Handler |
|----------|---------|
| `GET /api/reports/summary` | Total meetings, by type, by status |
| `GET /api/reports/room-utilization` | Hours booked per room in date range |
| `GET /api/reports/no-shows` | Participants who `Declined` or never responded (`Tentative`) for past meetings |

---

### 3. Bonus Features

#### Recurring Meetings
- `POST /api/meetings` accepts optional `recurrence` (`daily` | `weekly` | `monthly`) and `recurrence_end` date.
- `recurring.service.js` expands the pattern and creates individual meeting rows, each with conflict checks.
- UI shows a "Recurring" badge and lets you edit the series or single occurrence.

#### Email Invites with .ics
- On meeting creation/update, `email.service.js` uses Nodemailer to send an email to each participant.
- `ics.js` utility builds a valid `.ics` calendar attachment (VEVENT with DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION/URL).
- Falls back to Ethereal if no real SMTP is configured (logs preview URL to console).

#### Auto Jitsi Links
- When `type = 'online'` and no `online_link` is provided, auto-generate: `https://meet.jit.si/blaze-meeting-{meetingId}-{random}`.

#### Reminders
- `reminder.service.js` runs a `setInterval` (every 60s) that queries meetings starting in the next 10 minutes, and sends reminder emails to participants. Uses a `reminder_sent` boolean column (added to `meetings`) to avoid duplicates.

#### Drag-and-Drop Reschedule
- Calendar uses a library (`react-big-calendar` or custom) that emits `onEventDrop` with new start/end.
- Fires `PUT /api/meetings/:id` with the new times → server re-validates conflicts.

---

### 4. Frontend — React + Vite

#### Design System (`index.css`)
- **Dark theme** with glassmorphism cards
- Color palette: Deep navy (`#0f172a`) background, electric blue (`#3b82f6`) accents, emerald green for success, amber for warnings
- Typography: **Inter** from Google Fonts
- Smooth transitions on all interactive elements (200ms ease)
- Responsive grid system

#### Pages

| Page | Key Features |
|------|-------------|
| **Login / Register** | Glassmorphic card, animated gradient background, form validation |
| **Calendar Dashboard** | Day/week/month toggle, color-coded by meeting type, drag-and-drop reschedule, click to view details |
| **Create Meeting** | Multi-step form: Details → Participants → Slot/Room → Review. Integrated `SlotPicker`. Toggle online/offline. |
| **Meeting Detail** | Full info card, participant list with response badges, status timeline from log, action buttons (Edit / Cancel / Accept / Decline) |
| **My Meetings** | Tabs: Upcoming / Past. Filterable cards. |
| **Room Management** (Admin) | CRUD table with capacity, equipment tags, location |
| **Reports** | Bar charts (room utilization), pie charts (meeting types), stat cards (totals, no-shows). Uses `recharts`. |

#### Key Components

| Component | Notes |
|-----------|-------|
| `SlotPicker` | Calls `/api/availability`, renders a time grid with green (free) / red (busy) blocks. Click to select. |
| `ParticipantSelector` | Searchable dropdown of users. Shows conflict warnings in real-time. |
| `CalendarView` | Wraps `react-big-calendar` with custom styling. Supports `onEventDrop` for drag-and-drop. |
| `StatusBadge` | Color-coded pill: Draft (gray), Scheduled (blue), In Progress (amber), Completed (green), Cancelled (red) |
| `Layout` + `Sidebar` | Persistent sidebar with nav links, user avatar, logout. |

#### State & API

- **AuthContext** stores JWT + user info; wraps app in provider.
- **Axios interceptor** auto-attaches `Authorization: Bearer <token>` and handles 401 → redirect to login.
- **dayjs** with `utc` + `timezone` plugins for all time display.

---

### 5. Supporting Files

#### [NEW] `README.md`
Setup instructions, env var documentation, API docs summary, screenshots.

#### [NEW] `server/postman/MeetingSlotBooking.postman_collection.json`
Full Postman collection with all endpoints, example requests/responses, auth token variable.

#### [NEW] `.gitignore`
Standard Node + Vite ignores, `.env` files excluded.

---

## Verification Plan

### Automated Tests

1. **Database migrations**: Run migration script on startup → verify all tables exist via `\dt` equivalent query.
2. **API smoke tests via Postman collection**: Import and run the collection against the running server.
3. **Conflict logic**: 
   - Create two overlapping meetings for the same participant → expect 409.
   - Create two meetings in the same room at the same time → expect 409.
   - Create a meeting with start_time in the past → expect 400.
   - Create a meeting with title < 3 chars → expect 400.
   - Create a meeting with no participants → expect 400.
   - Cancel a meeting → verify status is `Cancelled` and log entry exists.

### Manual / Browser Verification

4. **Frontend walkthrough**: 
   - Register → Login → Create Meeting → View on Calendar → Reschedule via drag → Cancel → Check Reports.
   - Use browser subagent to visually verify each screen.
5. **Timezone rendering**: Create a meeting in UTC, verify it displays correctly in the browser's local timezone.
6. **Admin flow**: Login as admin → Create/edit rooms → verify non-admin cannot access room management.

### Build Verification

7. `cd server && npm install && node src/index.js` — server starts without errors.
8. `cd client && npm install && npm run dev` — Vite dev server starts, app loads in browser.
