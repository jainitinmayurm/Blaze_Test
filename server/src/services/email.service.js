const pool = require('../config/db');
const nodemailer = require('nodemailer');
const { generateICS } = require('../utils/ics');

/**
 * EMAIL SERVICE
 * Sends meeting invitations with .ics calendar attachments.
 * Falls back to Ethereal (test SMTP) if no real SMTP is configured.
 */

let transporter = null;

/**
 * Initialize the email transporter.
 */
async function initTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fall back to Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal test email account:', testAccount.user);
  }

  return transporter;
}

/**
 * Send meeting invitation emails to all participants.
 */
async function sendMeetingInvites(meeting, participantEmails, organizerEmail) {
  try {
    const transport = await initTransporter();
    const icsContent = generateICS(meeting, organizerEmail);

    for (const email of participantEmails) {
      const info = await transport.sendMail({
        from: `"Blaze Meeting Booking" <${organizerEmail}>`,
        to: email,
        subject: `Meeting Invitation: ${meeting.title}`,
        html: `
          <h2>📅 You've been invited to a meeting</h2>
          <p><strong>Title:</strong> ${meeting.title}</p>
          <p><strong>When:</strong> ${new Date(meeting.start_time).toUTCString()} - ${new Date(meeting.end_time).toUTCString()}</p>
          <p><strong>Type:</strong> ${meeting.type}</p>
          ${meeting.online_link ? `<p><strong>Link:</strong> <a href="${meeting.online_link}">${meeting.online_link}</a></p>` : ''}
          ${meeting.agenda ? `<p><strong>Agenda:</strong> ${meeting.agenda}</p>` : ''}
          <p>Please find the calendar invite attached.</p>
        `,
        icalEvent: {
          filename: 'meeting.ics',
          method: 'REQUEST',
          content: icsContent,
        },
      });

      // Log preview URL for Ethereal
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Email preview for ${email}: ${previewUrl}`);
      }
    }
  } catch (err) {
    console.error('Failed to send meeting invites:', err.message);
    // Don't throw — email failures shouldn't block meeting creation
  }
}

module.exports = { sendMeetingInvites, initTransporter };
