const pool = require('../config/db');

/** GET /api/reports/summary */
async function getSummary(req, res) {
  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params = [];
    if (from && to) {
      dateFilter = 'WHERE m.created_at >= $1 AND m.created_at <= $2';
      params.push(from, to);
    }

    const total = await pool.query(`SELECT COUNT(*) FROM meetings m ${dateFilter}`, params);
    const byStatus = await pool.query(
      `SELECT m.status, COUNT(*) as count FROM meetings m ${dateFilter} GROUP BY m.status ORDER BY count DESC`, params
    );
    const byType = await pool.query(
      `SELECT m.type, COUNT(*) as count FROM meetings m ${dateFilter} GROUP BY m.type`, params
    );

    res.json({
      total_meetings: parseInt(total.rows[0].count),
      by_status: byStatus.rows,
      by_type: byType.rows
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/** GET /api/reports/room-utilization */
async function getRoomUtilization(req, res) {
  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params = [];
    if (from && to) {
      dateFilter = `AND m.start_time >= $1 AND m.end_time <= $2`;
      params.push(from, to);
    }

    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.capacity,
              COUNT(m.id) AS total_bookings,
              COALESCE(SUM(EXTRACT(EPOCH FROM (m.end_time - m.start_time)) / 3600), 0) AS total_hours
       FROM rooms r
       LEFT JOIN meetings m ON m.room_id = r.id AND m.status NOT IN ('Cancelled') ${dateFilter}
       GROUP BY r.id, r.name, r.capacity
       ORDER BY total_hours DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('Room utilization error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/** GET /api/reports/no-shows */
async function getNoShows(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(CASE WHEN mp.response = 'Declined' THEN 1 END) AS declined_count,
              COUNT(CASE WHEN mp.response = 'Tentative' AND m.end_time < NOW() THEN 1 END) AS no_response_past,
              COUNT(mp.id) AS total_invites
       FROM users u
       JOIN meeting_participants mp ON mp.user_id = u.id
       JOIN meetings m ON m.id = mp.meeting_id
       WHERE m.status NOT IN ('Cancelled')
       GROUP BY u.id, u.name, u.email
       HAVING COUNT(CASE WHEN mp.response = 'Declined' THEN 1 END) > 0
          OR COUNT(CASE WHEN mp.response = 'Tentative' AND m.end_time < NOW() THEN 1 END) > 0
       ORDER BY no_response_past DESC, declined_count DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('No-shows error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getSummary, getRoomUtilization, getNoShows };
