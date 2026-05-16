const pool = require('../config/db');

/**
 * List all rooms.
 * GET /api/rooms
 */
async function listRooms(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('List rooms error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Create a new room (admin only).
 * POST /api/rooms
 */
async function createRoom(req, res) {
  try {
    const { name, capacity, equipment, location } = req.body;

    const result = await pool.query(
      `INSERT INTO rooms (name, capacity, equipment, location)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, parseInt(capacity), equipment || null, location || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update a room (admin only).
 * PUT /api/rooms/:id
 */
async function updateRoom(req, res) {
  try {
    const roomId = parseInt(req.params.id);
    const { name, capacity, equipment, location } = req.body;

    // Check room exists
    const existing = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const result = await pool.query(
      `UPDATE rooms SET
         name = COALESCE($1, name),
         capacity = COALESCE($2, capacity),
         equipment = COALESCE($3, equipment),
         location = COALESCE($4, location)
       WHERE id = $5
       RETURNING *`,
      [name, capacity ? parseInt(capacity) : null, equipment, location, roomId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get room availability for a specific date.
 * GET /api/rooms/:id/availability?date=2026-05-20
 */
async function getRoomAvailability(req, res) {
  try {
    const roomId = parseInt(req.params.id);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date query parameter is required.' });
    }

    // Check room exists
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    const bookings = await pool.query(
      `SELECT m.id, m.title, m.start_time, m.end_time, u.name AS organizer_name
       FROM meetings m
       JOIN users u ON u.id = m.organizer_id
       WHERE m.room_id = $1
         AND m.status NOT IN ('Cancelled')
         AND m.start_time < $3
         AND m.end_time > $2
       ORDER BY m.start_time`,
      [roomId, dayStart.toISOString(), dayEnd.toISOString()]
    );

    res.json({
      room: roomResult.rows[0],
      date,
      bookings: bookings.rows
    });
  } catch (err) {
    console.error('Room availability error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { listRooms, createRoom, updateRoom, getRoomAvailability };
