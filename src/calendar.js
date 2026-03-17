import { google } from 'googleapis';
import { getClient } from './auth.js';

export async function getAvailableSlots(daysAhead = 5, slotDurationMinutes = 30) {
  const auth = await getClient();
  const calendar = google.calendar({ version: 'v3', auth });

  // Define working hours
  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 17;

  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + daysAhead);

  // Fetch all existing events in the next X days
  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const busySlots = data.items
    .filter(event => event.start?.dateTime) // ignore all-day events
    .map(event => ({
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
    }));

  // Generate candidate slots during working hours
  const availableSlots = [];
  const cursor = new Date(now);

  // Round up to next clean 30-min mark
  cursor.setMinutes(cursor.getMinutes() < 30 ? 30 : 0);
  if (cursor.getMinutes() === 0) cursor.setHours(cursor.getHours() + 1);
  cursor.setSeconds(0);
  cursor.setMilliseconds(0);

  while (cursor < endDate && availableSlots.length < 5) {
    const dayOfWeek = cursor.getDay();
    const hour = cursor.getHours();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }

    // Skip outside working hours
    if (hour < WORK_START_HOUR) {
      cursor.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }

    if (hour >= WORK_END_HOUR) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }

    const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60000);

    // Check if this slot overlaps with any busy slot
    const isBusy = busySlots.some(
      busy => cursor < busy.end && slotEnd > busy.start
    );

    if (!isBusy) {
      availableSlots.push({
        start: new Date(cursor),
        end: slotEnd,
        label: cursor.toLocaleString('no-NO', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    // Move forward by slot duration
    cursor.setMinutes(cursor.getMinutes() + slotDurationMinutes);
  }

  return availableSlots;
}