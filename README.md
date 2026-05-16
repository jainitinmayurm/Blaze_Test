# 📅 Meeting Slot Booking System

A full-stack **Meeting Slot Booking System** built for seamless scheduling, real-time conflict detection, and intelligent room management. Supports online & offline meetings, recurring schedules, calendar views, and admin room control.

> **Team Member:** Jai Nitin Mayur M

---

## 🚀 Tech Stack

| Layer       | Technology                  |
| ----------- | --------------------------- |
| Frontend    | React 18 + Vite             |
| Backend     | Node.js + Express           |
| Database    | PostgreSQL                  |
| Auth        | JWT (bcrypt + access token) |
| Time Zones  | All stored UTC, rendered local |

---

## 📸 Screenshots

<!-- Add screenshots here after frontend is built -->

| Screen              | Preview |
| ------------------- | ------- |
| Calendar Dashboard  | _TODO_  |
| Create Meeting      | _TODO_  |
| Slot Picker         | _TODO_  |
| Meeting Detail      | _TODO_  |
| My Meetings         | _TODO_  |
| Room Management     | _TODO_  |
| Reports             | _TODO_  |

---

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** 14+
- **npm** v9+

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Blaze_Test.git
cd Blaze_Test
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see Environment Variables below), then start the server:

```bash
npm run dev
```

The server will automatically run all SQL migrations and seed the database on first startup.

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

### `server/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/meeting_booking

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# SMTP (optional — for email invites)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_user
SMTP_PASS=your_ethereal_pass

# Server
PORT=5000
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔑 Default Credentials (Seed Data)

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| Admin | admin@blaze.com     | Admin@123   |
| User  | alice@blaze.com     | User@123    |
| User  | bob@blaze.com       | User@123    |
| User  | charlie@blaze.com   | User@123    |
| User  | diana@blaze.com     | User@123    |

### Seeded Meeting Rooms

| Room               | Capacity | Equipment                    |
| ------------------ | -------- | ---------------------------- |
| Boardroom Alpha    | 20       | Projector, Whiteboard, Video |
| Huddle Room Beta   | 6        | Whiteboard, TV Screen        |
| Conference Room C  | 12       | Projector, Video Conf        |
| Phone Booth D      | 2        | None                         |
| Innovation Lab     | 30       | Projector, Whiteboard, 3D Printer |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login & get JWT      |
| GET    | `/api/auth/me`       | Get current user     |

### Meetings
| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | `/api/meetings`       | Create a meeting       |
| GET    | `/api/meetings`       | List meetings (filtered) |
| GET    | `/api/meetings/:id`   | Meeting details        |
| PUT    | `/api/meetings/:id`   | Edit / reschedule      |
| DELETE | `/api/meetings/:id`   | Cancel (soft-delete)   |

### Availability
| Method | Endpoint                                    | Description       |
| ------ | ------------------------------------------- | ----------------- |
| GET    | `/api/availability?participants=&date=`     | Free slots        |

### Rooms
| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| GET    | `/api/rooms`      | List rooms          |
| POST   | `/api/rooms`      | Create room (admin) |
| PUT    | `/api/rooms/:id`  | Edit room (admin)   |

### Calendar
| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/calendar?from=&to=`    | Calendar feed    |

### Reports
| Method | Endpoint                        | Description          |
| ------ | ------------------------------- | -------------------- |
| GET    | `/api/reports/summary`          | Meeting statistics   |
| GET    | `/api/reports/room-utilization` | Room usage stats     |
| GET    | `/api/reports/no-shows`         | No-show tracking     |

---

## 🏗️ Project Structure

```
Blaze_Test/
├── server/           # Express backend
│   ├── migrations/   # Raw SQL migration files
│   ├── src/
│   │   ├── config/       # DB connection
│   │   ├── middleware/    # Auth, validation
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── validators/   # express-validator schemas
│   │   └── utils/        # Helpers (ics, jitsi)
│   └── postman/      # Postman collection
├── client/           # React + Vite frontend
└── README.md
```

---

## ✨ Features

- ✅ Full CRUD for meetings with server-side validation
- ✅ Participant & room conflict detection
- ✅ Online + offline meeting support
- ✅ Calendar views (day / week / month)
- ✅ Slot picker showing free windows
- ✅ Soft-delete with status log history
- ✅ Role-based access (Admin / User)
- ✅ All times in UTC, rendered in user timezone
- 🌟 Recurring meetings (daily / weekly / monthly)
- 🌟 Email invites with .ics attachment
- 🌟 Auto-generated Jitsi meeting links
- 🌟 10-minute pre-meeting reminders
- 🌟 Drag-and-drop calendar reschedule

---

## 📄 License

This project was built for a hackathon submission. All rights reserved.
