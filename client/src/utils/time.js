import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatDate = (d) => dayjs.utc(d).tz(userTz).format('MMM D, YYYY');
export const formatTime = (d) => dayjs.utc(d).tz(userTz).format('h:mm A');
export const formatDateTime = (d) => dayjs.utc(d).tz(userTz).format('MMM D, YYYY h:mm A');
export const formatShortTime = (d) => dayjs.utc(d).tz(userTz).format('HH:mm');
export const fromNow = (d) => dayjs.utc(d).tz(userTz).fromNow();
export const getUserTimezone = () => userTz;
export { dayjs };
