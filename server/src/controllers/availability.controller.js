const pool = require('../config/db');

/**
 * Get free slots for a set of participants on a given date.
 * Optionally checks room availability too.
 *
 * GET /api/availability?participants=1,2,3&date=2026-05-20&room_id=1&duration=30
 */
async function getAvailability(req, res) {
  try {
    const { participants, date, room_id, duration } = req.query;

    if (!participants || !date) {
      return res.status(400).json({ error: 'participants and date are required query parameters.' });
    }

    const participantIds = participants.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one valid participant ID is required.' });
    }

    // Parse the date to get day boundaries in UTC
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);

    if (isNaN(dayStart.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Get all booked slots for participants on this day
    const participantBookings = await pool.query(
      `SELECT DISTINCT m.start_time, m.end_time, m.title, mp.user_id
       FROM meetings m
       JOIN meeting_participants mp ON mp.meeting_id = m.id
       WHERE mp.user_id = ANY($1)
         AND m.status NOT IN ('Cancelled')
         AND m.start_time < $3
         AND m.end_time > $2

       UNION

       SELECT DISTINCT m.start_time, m.end_time, m.title, m.organizer_id AS user_id
       FROM meetings m
       WHERE m.organizer_id = ANY($1)
         AND m.status NOT IN ('Cancelled')
         AND m.start_time < $3
         AND m.end_time > $2

       ORDER BY start_time`,
      [participantIds, dayStart.toISOString(), dayEnd.toISOString()]
    );

    // Get room bookings if room_id is specified
    let roomBookings = [];
    let roomInfo = null;
    if (room_id) {
      const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [parseInt(room_id)]);
      if (roomResult.rows.length > 0) {
        roomInfo = roomResult.rows[0];
      }

      const roomBookingResult = await pool.query(
        `SELECT m.start_time, m.end_time, m.title
         FROM meetings m
         WHERE m.room_id = $1
           AND m.status NOT IN ('Cancelled')
           AND m.start_time < $3
           AND m.end_time > $2
         ORDER BY m.start_time`,
        [parseInt(room_id), dayStart.toISOString(), dayEnd.toISOString()]
      );
      roomBookings = roomBookingResult.rows;
    }

    // Merge all busy periods
    const allBusySlots = [
      ...participantBookings.rows.map(b => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
        title: b.title,
        type: 'participant'
      })),
      ...roomBookings.map(b => ({
        start: new Date(b.start_time),
        end: new Date(b.end_time),
        title: b.title,
        type: 'room'
      }))
    ].sort((a, b) => a.start - b.start);

    // Merge overlapping busy slots
    const mergedBusy = [];
    for (const slot of allBusySlots) {
      if (mergedBusy.length === 0 || slot.start >= mergedBusy[mergedBusy.length - 1].end) {
        mergedBusy.push({ start: new Date(slot.start), end: new Date(slot.end) });
      } else {
        mergedBusy[mergedBusy.length - 1].end = new Date(
          Math.max(mergedBusy[mergedBusy.length - 1].end.getTime(), slot.end.getTime())
        );
      }
    }

    // Calculate free slots using working hours (08:00 - 18:00 UTC)
    const slotDuration = parseInt(duration) || 30; // minutes
    const workStart = new Date(`${date}T08:00:00Z`);
    const workEnd = new Date(`${date}T18:00:00Z`);

    const freeSlots = [];
    let cursor = new Date(workStart);

    for (const busy of mergedBusy) {
      // Add free time before this busy slot
      while (cursor.getTime() + slotDuration * 60000 <= busy.start.getTime() && cursor < workEnd) {
        const slotEnd = new Date(cursor.getTime() + slotDuration * 60000);
        if (slotEnd <= workEnd) {
          freeSlots.push({
            start: cursor.toISOString(),
            end: slotEnd.toISOString()
          });
        }
        cursor = new Date(slotEnd);
      }
      // Move cursor past this busy slot
      if (busy.end > cursor) {
        cursor = new Date(busy.end);
      }
    }

    // Add remaining free time after last busy slot
    while (cursor.getTime() + slotDuration * 60000 <= workEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + slotDuration * 60000);
      freeSlots.push({
        start: cursor.toISOString(),
        end: slotEnd.toISOString()
      });
      cursor = new Date(slotEnd);
    }

    res.json({
      date,
      participants: participantIds,
      room: roomInfo,
      slot_duration_minutes: slotDuration,
      busy_slots: allBusySlots.map(s => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        title: s.title,
        type: s.type
      })),
      free_slots: freeSlots,
      total_free_slots: freeSlots.length
    });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { getAvailability };
