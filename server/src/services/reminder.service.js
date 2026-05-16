const pool = require('../config/db');
const { sendMeetingInvites } = require('./email.service');

/**
 * REMINDER SERVICE
 * Checks every 60 seconds for meetings starting in the next 10 minutes
 * and sends reminder emails to participants.
 */

let reminderInterval = null;

/**
 * Start the reminder check loop.
 */
function startReminderService() {
  console.log('⏰ Reminder service started (checking every 60 seconds)');

  reminderInterval = setInterval(async () => {
    try {
      // Find meetings starting in the next 10 minutes that haven't had reminders sent
      const { rows: upcomingMeetings } = await pool.query(`
        SELECT m.*, u.email AS organizer_email, u.name AS organizer_name
        FROM meetings m
        JOIN users u ON u.id = m.organizer_id
        WHERE m.status = 'Scheduled'
          AND m.reminder_sent = FALSE
          AND m.start_time > NOW()
          AND m.start_time <= NOW() + INTERVAL '10 minutes'
      `);

      for (const meeting of upcomingMeetings) {
        // Get participant emails
        const { rows: participants } = await pool.query(
          `SELECT u.email FROM meeting_participants mp
           JOIN users u ON u.id = mp.user_id
           WHERE mp.meeting_id = $1`,
          [meeting.id]
        );

        const emails = participants.map(p => p.email);
        if (emails.length > 0) {
          await sendMeetingInvites(
            { ...meeting, title: `⏰ REMINDER: ${meeting.title}` },
            emails,
            meeting.organizer_email
          );
        }

        // Mark reminder as sent
        await pool.query(
          'UPDATE meetings SET reminder_sent = TRUE WHERE id = $1',
          [meeting.id]
        );

        console.log(`⏰ Reminder sent for meeting: ${meeting.title}`);
      }
    } catch (err) {
      console.error('Reminder service error:', err.message);
    }
  }, 60 * 1000); // Every 60 seconds
}

/**
 * Stop the reminder service.
 */
function stopReminderService() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('⏰ Reminder service stopped');
  }
}

module.exports = { startReminderService, stopReminderService };
