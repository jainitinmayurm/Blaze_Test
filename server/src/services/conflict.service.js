const pool = require('../config/db');

/**
 * CONFLICT DETECTION ENGINE
 *
 * This service handles all server-side conflict checks for meetings:
 * 1. Participant time conflicts — no person can have overlapping meetings
 * 2. Room time conflicts — no room can be double-booked
 * 3. Room capacity validation — room must fit all participants
 *
 * All checks use PostgreSQL's OVERLAPS operator for precise time-range comparison.
 * Cancelled meetings are excluded from all conflict checks.
 */

/**
 * Check if any of the given participants have a conflicting meeting
 * in the given time range.
 *
 * @param {number[]} participantIds - Array of user IDs to check
 * @param {string} startTime - ISO 8601 start time (UTC)
 * @param {string} endTime - ISO 8601 end time (UTC)
 * @param {number|null} excludeMeetingId - Meeting ID to exclude (for updates)
 * @returns {Object[]} Array of conflict objects: { user_id, user_name, meeting_id, meeting_title, start_time, end_time }
 */
async function checkParticipantConflicts(participantIds, startTime, endTime, excludeMeetingId = null) {
  if (!participantIds || participantIds.length === 0) return [];

  const query = `
    SELECT DISTINCT
      u.id AS user_id,
      u.name AS user_name,
      m.id AS meeting_id,
      m.title AS meeting_title,
      m.start_time,
      m.end_time
    FROM meetings m
    JOIN meeting_participants mp ON mp.meeting_id = m.id
    JOIN users u ON u.id = mp.user_id
    WHERE mp.user_id = ANY($1)
      AND m.status NOT IN ('Cancelled')
      AND (m.start_time, m.end_time) OVERLAPS ($2::timestamptz, $3::timestamptz)
      ${excludeMeetingId ? 'AND m.id != $4' : ''}

    UNION

    SELECT DISTINCT
      u.id AS user_id,
      u.name AS user_name,
      m.id AS meeting_id,
      m.title AS meeting_title,
      m.start_time,
      m.end_time
    FROM meetings m
    JOIN users u ON u.id = m.organizer_id
    WHERE m.organizer_id = ANY($1)
      AND m.status NOT IN ('Cancelled')
      AND (m.start_time, m.end_time) OVERLAPS ($2::timestamptz, $3::timestamptz)
      ${excludeMeetingId ? 'AND m.id != $4' : ''}
    ORDER BY user_id, start_time;
  `;

  const params = excludeMeetingId
    ? [participantIds, startTime, endTime, excludeMeetingId]
    : [participantIds, startTime, endTime];

  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Check if a room is already booked in the given time range.
 *
 * @param {number} roomId - Room ID to check
 * @param {string} startTime - ISO 8601 start time (UTC)
 * @param {string} endTime - ISO 8601 end time (UTC)
 * @param {number|null} excludeMeetingId - Meeting ID to exclude (for updates)
 * @returns {Object[]} Array of conflicting meetings
 */
async function checkRoomConflict(roomId, startTime, endTime, excludeMeetingId = null) {
  if (!roomId) return [];

  const query = `
    SELECT m.id AS meeting_id, m.title, m.start_time, m.end_time
    FROM meetings m
    WHERE m.room_id = $1
      AND m.status NOT IN ('Cancelled')
      AND (m.start_time, m.end_time) OVERLAPS ($2::timestamptz, $3::timestamptz)
      ${excludeMeetingId ? 'AND m.id != $4' : ''}
    ORDER BY m.start_time;
  `;

  const params = excludeMeetingId
    ? [roomId, startTime, endTime, excludeMeetingId]
    : [roomId, startTime, endTime];

  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Validate that a room exists and has sufficient capacity.
 *
 * @param {number} roomId - Room ID
 * @param {number} participantCount - Number of participants (including organizer)
 * @returns {{ valid: boolean, room: Object|null, error: string|null }}
 */
async function validateRoomCapacity(roomId, participantCount) {
  const { rows } = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);

  if (rows.length === 0) {
    return { valid: false, room: null, error: `Room with ID ${roomId} does not exist.` };
  }

  const room = rows[0];
  if (room.capacity < participantCount) {
    return {
      valid: false,
      room,
      error: `Room "${room.name}" has a capacity of ${room.capacity}, but ${participantCount} participants were requested.`
    };
  }

  return { valid: true, room, error: null };
}

/**
 * Run ALL conflict checks for a meeting.
 * Returns a structured result with all errors found.
 *
 * @param {Object} params
 * @param {number[]} params.participantIds - All participant user IDs (excluding organizer)
 * @param {number} params.organizerId - Organizer user ID
 * @param {string} params.startTime - ISO 8601
 * @param {string} params.endTime - ISO 8601
 * @param {string} params.type - 'online' or 'offline'
 * @param {number|null} params.roomId - Room ID (required for offline)
 * @param {string|null} params.onlineLink - Online meeting link
 * @param {string|null} params.status - Target status
 * @param {number|null} params.excludeMeetingId - For updates
 * @returns {{ valid: boolean, errors: string[], participantConflicts: Object[], roomConflicts: Object[] }}
 */
async function runAllConflictChecks({
  participantIds,
  organizerId,
  startTime,
  endTime,
  type,
  roomId,
  onlineLink,
  status,
  excludeMeetingId = null
}) {
  const errors = [];
  let participantConflicts = [];
  let roomConflicts = [];

  // 1. Check that organizer is not in the participant list
  const allPeopleIds = [...new Set([organizerId, ...participantIds])];

  // 2. Check participant time conflicts (includes organizer)
  participantConflicts = await checkParticipantConflicts(
    allPeopleIds, startTime, endTime, excludeMeetingId
  );

  if (participantConflicts.length > 0) {
    const names = [...new Set(participantConflicts.map(c => c.user_name))];
    errors.push(
      `Participant conflict: ${names.join(', ')} ${names.length > 1 ? 'have' : 'has'} overlapping meeting(s) in the requested time slot.`
    );
  }

  // 3. For offline meetings: validate room
  if (type === 'offline') {
    if (!roomId) {
      errors.push('Offline meetings must have a room assigned.');
    } else {
      // 3a. Room capacity check (participants + organizer)
      const totalPeople = participantIds.length + 1; // +1 for organizer
      const capacityResult = await validateRoomCapacity(roomId, totalPeople);
      if (!capacityResult.valid) {
        errors.push(capacityResult.error);
      }

      // 3b. Room time conflict check
      roomConflicts = await checkRoomConflict(roomId, startTime, endTime, excludeMeetingId);
      if (roomConflicts.length > 0) {
        errors.push(
          `Room conflict: The selected room is already booked for "${roomConflicts[0].title}" from ${roomConflicts[0].start_time} to ${roomConflicts[0].end_time}.`
        );
      }
    }
  }

  // 4. Online meetings moving to Scheduled must have a link
  if (type === 'online' && status === 'Scheduled' && !onlineLink) {
    errors.push('Online meetings must have a non-empty meeting link before the status can be set to Scheduled.');
  }

  return {
    valid: errors.length === 0,
    errors,
    participantConflicts,
    roomConflicts
  };
}

module.exports = {
  checkParticipantConflicts,
  checkRoomConflict,
  validateRoomCapacity,
  runAllConflictChecks
};
