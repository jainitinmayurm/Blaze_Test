/**
 * Generates an .ics calendar file string for a meeting.
 *
 * @param {Object} meeting - Meeting object
 * @param {string} meeting.title - Meeting title
 * @param {string} meeting.agenda - Meeting description
 * @param {string} meeting.start_time - ISO datetime (UTC)
 * @param {string} meeting.end_time - ISO datetime (UTC)
 * @param {string} [meeting.online_link] - Online meeting URL
 * @param {string} [meeting.location] - Physical location
 * @param {string} organizerEmail - Organizer email
 * @returns {string} .ics file content
 */
function generateICS(meeting, organizerEmail) {
  const formatDate = (isoStr) => {
    return new Date(isoStr)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };

  const uid = `meeting-${meeting.id}@blaze-booking`;
  const location = meeting.online_link || meeting.location || '';
  const description = (meeting.agenda || '').replace(/\n/g, '\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Blaze Meeting Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatDate(meeting.start_time)}`,
    `DTEND:${formatDate(meeting.end_time)}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `ORGANIZER:mailto:${organizerEmail}`,
    `DTSTAMP:${formatDate(new Date().toISOString())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return ics;
}

module.exports = { generateICS };
