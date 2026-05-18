require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// 1. Initialize Express application
const app = express();

// 2. Setup Middleware
app.use(cors());
app.use(express.json());

// --- API ROUTES ---

// GET /api/users: Fetch all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/rooms: Fetch all meeting rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/rooms: Create a new meeting room
app.post('/api/rooms', async (req, res) => {
  const { name, capacity, equipment } = req.body;
  const id = Date.now().toString();

  try {
    const result = await db.query(
      'INSERT INTO rooms (id, name, capacity, equipment) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, capacity, equipment]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/meetings: Fetch all meetings
app.get('/api/meetings', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.id, m.title, m.agenda, m.type, m.room_id as "roomId", m.link, m.start_time as "start", m.end_time as "end", m.status,
             COALESCE(json_agg(mp.user_id) FILTER (WHERE mp.user_id IS NOT NULL), '[]') as participants
      FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      GROUP BY m.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meetings: Create a new meeting
app.post('/api/meetings', async (req, res) => {
  const { title, agenda, type, roomId, link, start, end, participants } = req.body;
  const id = Date.now().toString();
  const status = 'Scheduled';

  try {
    await db.query('BEGIN');

    const meetingResult = await db.query(
      'INSERT INTO meetings (id, title, agenda, type, room_id, link, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, title, agenda, type, roomId || null, link || '', start, end, status]
    );

    const newMeeting = { ...meetingResult.rows[0], roomId: meetingResult.rows[0].room_id, start: meetingResult.rows[0].start_time, end: meetingResult.rows[0].end_time, participants: [] };
    delete newMeeting.room_id;
    delete newMeeting.start_time;
    delete newMeeting.end_time;

    if (participants && Array.isArray(participants)) {
      for (const userId of participants) {
        await db.query(
          'INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)',
          [id, userId]
        );
        newMeeting.participants.push(userId);
      }
    }

    await db.query('COMMIT');
    res.json(newMeeting);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/meetings/:id: Update an existing meeting (e.g., to cancel it)
app.put('/api/meetings/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    // Basic dynamic update query builder for simplicity
    const setClause = Object.keys(updates).map((key, index) => {
      let dbKey = key;
      if (key === 'roomId') dbKey = 'room_id';
      if (key === 'start') dbKey = 'start_time';
      if (key === 'end') dbKey = 'end_time';
      return `${dbKey} = $${index + 1}`;
    }).join(', ');

    const values = Object.values(updates);
    values.push(id); // for the WHERE clause

    const query = `UPDATE meetings SET ${setClause} WHERE id = $${values.length} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rows.length > 0) {
      // Re-fetch with participants to return full object
      const fullMeeting = await db.query(`
        SELECT m.id, m.title, m.agenda, m.type, m.room_id as "roomId", m.link, m.start_time as "start", m.end_time as "end", m.status,
               COALESCE(json_agg(mp.user_id) FILTER (WHERE mp.user_id IS NOT NULL), '[]') as participants
        FROM meetings m
        LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
        WHERE m.id = $1
        GROUP BY m.id
      `, [id]);
      res.json(fullMeeting.rows[0]);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reports: Fetch aggregated statistics for the dashboard
app.get('/api/reports', async (req, res) => {
  try {
    const meetingsCount = await db.query('SELECT COUNT(*) FROM meetings');
    const roomsCount = await db.query('SELECT COUNT(*) FROM rooms');
    const cancelledCount = await db.query("SELECT COUNT(*) FROM meetings WHERE status = 'Cancelled'");

    res.json({
      totalMeetings: parseInt(meetingsCount.rows[0].count),
      totalRooms: parseInt(roomsCount.rows[0].count),
      cancelled: parseInt(cancelledCount.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Minimal backend running on http://localhost:${PORT}`));
