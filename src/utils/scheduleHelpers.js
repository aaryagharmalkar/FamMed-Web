const MORNING_HOUR = 8;
const EVENING_HOUR = 20;

const detectTimesPerDay = (medicine) => {
  const fromExplicit = Number(medicine?.times_per_day);
  if (Number.isFinite(fromExplicit) && fromExplicit > 0) return Math.min(6, Math.max(1, Math.round(fromExplicit)));

  const frequency = String(medicine?.frequency || '').toLowerCase();
  if (frequency.includes('thrice') || frequency.includes('three')) return 3;
  if (frequency.includes('twice') || frequency.includes('two')) return 2;
  if (frequency.includes('once') || frequency.includes('daily') || frequency.includes('every day')) return 1;

  const hourlyMatch = frequency.match(/every\s*(\d+)\s*hour/);
  if (hourlyMatch) {
    const interval = Number(hourlyMatch[1]);
    if (interval > 0) return Math.min(6, Math.max(1, Math.round(24 / interval)));
  }

  return 1;
};

const buildDailySlots = (timesPerDay) => {
  if (timesPerDay <= 1) return ['09:00:00'];

  const step = Math.floor((EVENING_HOUR - MORNING_HOUR) / (timesPerDay - 1));
  return Array.from({ length: timesPerDay }).map((_, index) => {
    const hour = MORNING_HOUR + step * index;
    return `${String(hour).padStart(2, '0')}:00:00`;
  });
};

const parseSlot = (slot) => slot.split(':').map((part) => Number(part));

export function getNextScheduledTime(medicine) {
  const now = new Date();
  const startDate = medicine?.start_date ? new Date(medicine.start_date) : new Date(now);
  const anchor = now < startDate ? startDate : now;

  const slots = buildDailySlots(detectTimesPerDay(medicine));
  for (const slot of slots) {
    const [hours = 0, minutes = 0, seconds = 0] = parseSlot(slot);
    const candidate = new Date(anchor);
    candidate.setHours(hours, minutes, seconds, 0);
    if (candidate > now) return candidate.toISOString();
  }

  const [hours = 0, minutes = 0, seconds = 0] = parseSlot(slots[0]);
  const tomorrow = new Date(anchor);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, seconds, 0);
  return tomorrow.toISOString();
}