const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'db.json');

// Helper to read DB
const readDB = () => {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// --- ROUTES ---

// GET /api/users
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

// GET /api/rooms
app.get('/api/rooms', (req, res) => {
  const db = readDB();
  res.json(db.rooms);
});

// POST /api/rooms
app.post('/api/rooms', (req, res) => {
  const db = readDB();
  const newRoom = { id: Date.now().toString(), ...req.body };
  db.rooms.push(newRoom);
  writeDB(db);
  res.json(newRoom);
});

// GET /api/meetings
app.get('/api/meetings', (req, res) => {
  const db = readDB();
  res.json(db.meetings);
});

// POST /api/meetings
app.post('/api/meetings', (req, res) => {
  const db = readDB();
  const newMeeting = { id: Date.now().toString(), status: 'Scheduled', ...req.body };
  db.meetings.push(newMeeting);
  writeDB(db);
  res.json(newMeeting);
});

// PUT /api/meetings/:id
app.put('/api/meetings/:id', (req, res) => {
  const db = readDB();
  const index = db.meetings.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    db.meetings[index] = { ...db.meetings[index], ...req.body };
    writeDB(db);
    res.json(db.meetings[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// GET /api/reports
app.get('/api/reports', (req, res) => {
  const db = readDB();
  const totalMeetings = db.meetings.length;
  const totalRooms = db.rooms.length;
  const cancelled = db.meetings.filter(m => m.status === 'Cancelled').length;
  res.json({ totalMeetings, totalRooms, cancelled });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Minimal backend running on http://localhost:${PORT}`));
