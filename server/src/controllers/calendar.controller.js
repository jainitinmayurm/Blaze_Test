const pool = require('../config/db');

/**
 * Get calendar feed for the logged-in user.
 * GET /api/calendar?from=&to=
 */
async function getCalendarFeed(req, res) {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query parameters are required.' });
    }

    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT DISTINCT m.*, r.name AS room_name, u.name AS organizer_name,
              CASE WHEN m.organizer_id = $1 THEN true ELSE false END AS is_organizer,
              mp.response AS my_response
       FROM meetings m
       JOIN users u ON u.id = m.organizer_id
       LEFT JOIN rooms r ON r.id = m.room_id
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = $1
       WHERE (m.organizer_id = $1 OR mp.user_id = $1)
         AND m.start_time >= $2 AND m.start_time <= $3
       ORDER BY m.start_time`,
      [userId, from, to]
    );

    const events = rows.map(m => ({
      id: m.id, title: m.title, start: m.start_time, end: m.end_time,
      type: m.type, status: m.status, room_name: m.room_name,
      organizer_name: m.organizer_name, is_organizer: m.is_organizer,
      my_response: m.my_response, online_link: m.online_link
    }));

    res.json(events);
  } catch (err) {
    console.error('Calendar feed error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getCalendarFeed };
