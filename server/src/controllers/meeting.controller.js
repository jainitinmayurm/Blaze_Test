const meetingService = require('../services/meeting.service');
const { sendMeetingInvites } = require('../services/email.service');
const pool = require('../config/db');

/**
 * Create a new meeting.
 * POST /api/meetings
 */
async function createMeeting(req, res) {
  try {
    const meeting = await meetingService.createMeeting(req.body, req.user.id);

    // Send email invites asynchronously (don't block response)
    setImmediate(async () => {
      try {
        const { rows: participants } = await pool.query(
          `SELECT u.email FROM meeting_participants mp
           JOIN users u ON u.id = mp.user_id
           WHERE mp.meeting_id = $1`,
          [meeting.id]
        );
        const { rows: organizer } = await pool.query(
          'SELECT email FROM users WHERE id = $1', [req.user.id]
        );
        if (participants.length > 0 && organizer.length > 0) {
          await sendMeetingInvites(meeting, participants.map(p => p.email), organizer[0].email);
        }
      } catch (err) {
        console.error('Email send error:', err.message);
      }
    });

    // Fetch full meeting details to return
    const fullMeeting = await meetingService.getMeetingById(meeting.id);
    res.status(201).json(fullMeeting);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.message,
        errors: err.errors || [],
        conflicts: err.conflicts || []
      });
    }
    console.error('Create meeting error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get meeting details.
 * GET /api/meetings/:id
 */
async function getMeeting(req, res) {
  try {
    const meeting = await meetingService.getMeetingById(parseInt(req.params.id));
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }
    res.json(meeting);
  } catch (err) {
    console.error('Get meeting error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * List meetings with filters.
 * GET /api/meetings
 */
async function listMeetings(req, res) {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      from: req.query.from,
      to: req.query.to,
      organizer_id: req.query.organizer_id ? parseInt(req.query.organizer_id) : null,
      user_id: req.query.user_id ? parseInt(req.query.user_id) : null,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    };

    const result = await meetingService.listMeetings(filters);
    res.json(result);
  } catch (err) {
    console.error('List meetings error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update / reschedule a meeting.
 * PUT /api/meetings/:id
 */
async function updateMeeting(req, res) {
  try {
    const meetingId = parseInt(req.params.id);
    const updated = await meetingService.updateMeeting(meetingId, req.body, req.user.id);
    res.json(updated);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.message,
        errors: err.errors || []
      });
    }
    console.error('Update meeting error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Cancel (soft-delete) a meeting.
 * DELETE /api/meetings/:id
 */
async function cancelMeeting(req, res) {
  try {
    const meetingId = parseInt(req.params.id);
    const result = await meetingService.cancelMeeting(meetingId, req.user.id, req.body.reason);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Cancel meeting error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update participant response (Accept/Decline/Tentative).
 * PUT /api/meetings/:id/respond
 */
async function respondToMeeting(req, res) {
  try {
    const meetingId = parseInt(req.params.id);
    const { response } = req.body;

    if (!['Accepted', 'Declined', 'Tentative'].includes(response)) {
      return res.status(400).json({ error: 'Response must be Accepted, Declined, or Tentative.' });
    }

    const result = await pool.query(
      `UPDATE meeting_participants SET response = $1
       WHERE meeting_id = $2 AND user_id = $3
       RETURNING *`,
      [response, meetingId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a participant of this meeting.' });
    }

    res.json({ message: `Response updated to ${response}.`, participant: result.rows[0] });
  } catch (err) {
    console.error('Respond to meeting error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { createMeeting, getMeeting, listMeetings, updateMeeting, cancelMeeting, respondToMeeting };
