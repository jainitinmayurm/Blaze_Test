const { v4: uuidv4 } = require('uuid');

/**
 * Generates a Jitsi Meet link for online meetings.
 * Uses a combination of meeting ID and random UUID for uniqueness.
 */
function generateJitsiLink(meetingId) {
  const slug = uuidv4().split('-')[0];
  return `https://meet.jit.si/blaze-meeting-${meetingId}-${slug}`;
}

module.exports = { generateJitsiLink };
