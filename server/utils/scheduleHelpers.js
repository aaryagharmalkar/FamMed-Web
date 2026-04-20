const DEFAULT_TIME_SLOTS = ['08:00', '14:00', '20:00', '22:00'];

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTimeSlots = ({ frequencyPerDay, timeSlots }) => {
  const targetCount = Math.max(1, toInt(frequencyPerDay, 1));
  const cleanSlots = Array.isArray(timeSlots)
    ? timeSlots
        .map((slot) => String(slot || '').trim())
        .filter((slot) => /^\d{2}:\d{2}$/.test(slot))
    : [];

  const selected = cleanSlots.slice(0, targetCount);
  while (selected.length < targetCount) {
    selected.push(DEFAULT_TIME_SLOTS[selected.length] || '09:00');
  }

  return selected;
};

const combineDateAndTimeIso = ({ date, timeSlot, timezone = 'UTC' }) => {
  const [hours, minutes] = timeSlot.split(':').map((value) => Number.parseInt(value, 10));
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);

  return {
    startIso: d.toISOString(),
    endIso: new Date(d.getTime() + 15 * 60 * 1000).toISOString(),
    timezone,
  };
};

export const buildCalendarEventTemplates = ({
  frequencyPerDay,
  durationDays,
  timeSlots,
  startDate,
  timezone = 'UTC',
}) => {
  const slots = normalizeTimeSlots({ frequencyPerDay, timeSlots });
  const totalDays = Math.max(1, toInt(durationDays, 1));
  const anchorDate = startDate ? new Date(startDate) : new Date();

  return slots.map((slot) => {
    const { startIso, endIso } = combineDateAndTimeIso({
      date: anchorDate,
      timeSlot: slot,
      timezone,
    });

    return {
      timeSlot: slot,
      totalDays,
      startIso,
      endIso,
      timezone,
      recurrenceRule: `RRULE:FREQ=DAILY;COUNT=${totalDays}`,
    };
  });
};

export const buildReminderRows = ({
  medicineId,
  familyId,
  userId,
  eventId,
  timeSlot,
  durationDays,
  startDate,
}) => {
  const rows = [];
  const days = Math.max(1, toInt(durationDays, 1));
  const [hours, minutes] = timeSlot.split(':').map((value) => Number.parseInt(value, 10));
  const base = startDate ? new Date(startDate) : new Date();

  for (let day = 0; day < days; day += 1) {
    const date = new Date(base);
    date.setDate(date.getDate() + day);
    date.setHours(hours, minutes, 0, 0);

    rows.push({
      medicine_id: medicineId,
      family_id: familyId,
      user_id: userId,
      assigned_to: userId,
      event_id: eventId,
      google_event_id: eventId,
      scheduled_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
      days_of_week: [date.getDay()],
      is_active: true,
    });
  }

  return rows;
};
