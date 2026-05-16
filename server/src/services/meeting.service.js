const pool = require('../config/db');
const { runAllConflictChecks } = require('./conflict.service');
const { generateJitsiLink } = require('../utils/jitsi');

/**
 * MEETING SERVICE
 * Handles all meeting CRUD operations with integrated conflict checking.
 */

/**
 * Create a new meeting with full conflict validation.
 */
async function createMeeting({ title, agenda, type, start_time, end_time, room_id, online_link, participants, recurrence, recurrence_end, status }, organizerId) {
  // Filter organizer out of participants to avoid duplicates
  const filteredParticipants = participants.filter(id => id !== organizerId);

  if (filteredParticipants.length === 0) {
    throw { status: 400, message: 'At least one participant other than the organizer is required.' };
  }

  // Determine target status
  const targetStatus = status || (type === 'online' && !online_link ? 'Draft' : 'Scheduled');

  // Run all conflict checks
  const conflicts = await runAllConflictChecks({
    participantIds: filteredParticipants,
    organizerId,
    startTime: start_time,
    endTime: end_time,
    type,
    roomId: room_id || null,
    onlineLink: online_link || null,
    status: targetStatus,
    excludeMeetingId: null
  });

  if (!conflicts.valid) {
    throw { status: 409, message: 'Conflict detected', errors: conflicts.errors, conflicts: conflicts.participantConflicts };
  }

  // Auto-generate Jitsi link for online meetings if no link provided
  let finalOnlineLink = online_link || null;

  // Insert the meeting
  const meetingResult = await pool.query(
    `INSERT INTO meetings (title, agenda, type, start_time, end_time, room_id, online_link, organizer_id, status, recurrence, recurrence_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [title, agenda || null, type, start_time, end_time, room_id || null, finalOnlineLink, organizerId, targetStatus, recurrence || null, recurrence_end || null]
  );

  const meeting = meetingResult.rows[0];

  // Auto-generate Jitsi link now that we have the meeting ID
  if (type === 'online' && !finalOnlineLink) {
    finalOnlineLink = generateJitsiLink(meeting.id);
    await pool.query('UPDATE meetings SET online_link = $1 WHERE id = $2', [finalOnlineLink, meeting.id]);
    meeting.online_link = finalOnlineLink;

    // If status was Draft because of missing link, upgrade to Scheduled
    if (targetStatus === 'Draft') {
      await pool.query('UPDATE meetings SET status = $1 WHERE id = $2', ['Scheduled', meeting.id]);
      meeting.status = 'Scheduled';
    }
  }

  // Insert participants
  if (filteredParticipants.length > 0) {
    const participantValues = filteredParticipants
      .map((userId, i) => `($1, $${i + 2})`)
      .join(', ');
    const participantParams = [meeting.id, ...filteredParticipants];

    await pool.query(
      `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${participantValues} ON CONFLICT DO NOTHING`,
      participantParams
    );
  }

  // Log status creation
  await pool.query(
    `INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, reason)
     VALUES ($1, NULL, $2, $3, $4)`,
    [meeting.id, meeting.status, organizerId, 'Meeting created']
  );

  return meeting;
}

/**
 * Get a single meeting by ID with full details.
 */
async function getMeetingById(meetingId) {
  const meetingResult = await pool.query(
    `SELECT m.*,
            u.name AS organizer_name,
            u.email AS organizer_email,
            r.name AS room_name,
            r.capacity AS room_capacity,
            r.location AS room_location
     FROM meetings m
     JOIN users u ON u.id = m.organizer_id
     LEFT JOIN rooms r ON r.id = m.room_id
     WHERE m.id = $1`,
    [meetingId]
  );

  if (meetingResult.rows.length === 0) return null;

  const meeting = meetingResult.rows[0];

  // Get participants
  const participantsResult = await pool.query(
    `SELECT mp.id, mp.user_id, mp.response, u.name, u.email
     FROM meeting_participants mp
     JOIN users u ON u.id = mp.user_id
     WHERE mp.meeting_id = $1
     ORDER BY u.name`,
    [meetingId]
  );

  // Get status log
  const logResult = await pool.query(
    `SELECT msl.*, u.name AS changed_by_name
     FROM meeting_status_log msl
     JOIN users u ON u.id = msl.changed_by
     WHERE msl.meeting_id = $1
     ORDER BY msl.changed_at ASC`,
    [meetingId]
  );

  return {
    ...meeting,
    participants: participantsResult.rows,
    status_log: logResult.rows
  };
}

/**
 * List meetings with optional filters.
 */
async function listMeetings({ status, type, from, to, organizer_id, user_id, page = 1, limit = 50 }) {
  let conditions = [];
  let params = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`m.status = $${paramIndex++}`);
    params.push(status);
  }

  if (type) {
    conditions.push(`m.type = $${paramIndex++}`);
    params.push(type);
  }

  if (from) {
    conditions.push(`m.end_time >= $${paramIndex++}`);
    params.push(from);
  }

  if (to) {
    conditions.push(`m.start_time <= $${paramIndex++}`);
    params.push(to);
  }

  if (organizer_id) {
    conditions.push(`m.organizer_id = $${paramIndex++}`);
    params.push(organizer_id);
  }

  // If user_id is provided, show meetings where user is organizer OR participant
  if (user_id) {
    conditions.push(`(m.organizer_id = $${paramIndex} OR EXISTS (
      SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = $${paramIndex}
    ))`);
    params.push(user_id);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const query = `
    SELECT m.*,
           u.name AS organizer_name,
           r.name AS room_name,
           (SELECT COUNT(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id) AS participant_count
    FROM meetings m
    JOIN users u ON u.id = m.organizer_id
    LEFT JOIN rooms r ON r.id = m.room_id
    ${whereClause}
    ORDER BY m.start_time DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  const { rows } = await pool.query(query, params);

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM meetings m ${whereClause}`;
  const countResult = await pool.query(countQuery, params.slice(0, params.length - 2));

  return {
    meetings: rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit)
  };
}

/**
 * Update a meeting with conflict re-validation.
 */
async function updateMeeting(meetingId, updates, userId) {
  // Get existing meeting
  const existing = await getMeetingById(meetingId);
  if (!existing) {
    throw { status: 404, message: 'Meeting not found.' };
  }

  if (existing.status === 'Cancelled') {
    throw { status: 400, message: 'Cannot update a cancelled meeting.' };
  }

  // Merge updates with existing values
  const merged = {
    title: updates.title || existing.title,
    agenda: updates.agenda !== undefined ? updates.agenda : existing.agenda,
    type: updates.type || existing.type,
    start_time: updates.start_time || existing.start_time,
    end_time: updates.end_time || existing.end_time,
    room_id: updates.room_id !== undefined ? updates.room_id : existing.room_id,
    online_link: updates.online_link !== undefined ? updates.online_link : existing.online_link,
    status: updates.status || existing.status,
    recurrence: updates.recurrence !== undefined ? updates.recurrence : existing.recurrence,
    recurrence_end: updates.recurrence_end !== undefined ? updates.recurrence_end : existing.recurrence_end,
  };

  // Determine participants
  const participantIds = updates.participants
    ? updates.participants.filter(id => id !== existing.organizer_id)
    : existing.participants.map(p => p.user_id);

  if (participantIds.length === 0) {
    throw { status: 400, message: 'At least one participant other than the organizer is required.' };
  }

  // Run conflict checks with the merged values
  const conflicts = await runAllConflictChecks({
    participantIds,
    organizerId: existing.organizer_id,
    startTime: merged.start_time,
    endTime: merged.end_time,
    type: merged.type,
    roomId: merged.room_id,
    onlineLink: merged.online_link,
    status: merged.status,
    excludeMeetingId: meetingId
  });

  if (!conflicts.valid) {
    throw { status: 409, message: 'Conflict detected', errors: conflicts.errors };
  }

  // Auto-generate Jitsi link if needed
  if (merged.type === 'online' && !merged.online_link) {
    merged.online_link = generateJitsiLink(meetingId);
  }

  // Update the meeting
  await pool.query(
    `UPDATE meetings SET
       title = $1, agenda = $2, type = $3, start_time = $4, end_time = $5,
       room_id = $6, online_link = $7, status = $8, recurrence = $9, recurrence_end = $10
     WHERE id = $11`,
    [merged.title, merged.agenda, merged.type, merged.start_time, merged.end_time,
     merged.room_id, merged.online_link, merged.status, merged.recurrence, merged.recurrence_end,
     meetingId]
  );

  // Update participants if provided
  if (updates.participants) {
    await pool.query('DELETE FROM meeting_participants WHERE meeting_id = $1', [meetingId]);
    if (participantIds.length > 0) {
      const values = participantIds.map((uid, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [meetingId, ...participantIds]
      );
    }
  }

  // Log status change if status changed
  if (updates.status && updates.status !== existing.status) {
    await pool.query(
      `INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [meetingId, existing.status, updates.status, userId, updates.reason || 'Meeting updated']
    );
  }

  return await getMeetingById(meetingId);
}

/**
 * Cancel (soft-delete) a meeting.
 */
async function cancelMeeting(meetingId, userId, reason) {
  const existing = await getMeetingById(meetingId);
  if (!existing) {
    throw { status: 404, message: 'Meeting not found.' };
  }

  if (existing.status === 'Cancelled') {
    throw { status: 400, message: 'Meeting is already cancelled.' };
  }

  const previousStatus = existing.status;

  await pool.query(
    'UPDATE meetings SET status = $1 WHERE id = $2',
    ['Cancelled', meetingId]
  );

  await pool.query(
    `INSERT INTO meeting_status_log (meeting_id, from_status, to_status, changed_by, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [meetingId, previousStatus, 'Cancelled', userId, reason || 'Meeting cancelled']
  );

  return { message: 'Meeting cancelled successfully.', meetingId };
}

module.exports = {
  createMeeting,
  getMeetingById,
  listMeetings,
  updateMeeting,
  cancelMeeting
};
