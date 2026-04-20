import {
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';

const toDate = (value) => (value instanceof Date ? value : parseISO(value));

const normalizeDay = (value) => format(toDate(value), 'yyyy-MM-dd');

export const groupLogsByDate = (logs = []) =>
  logs.reduce((acc, log) => {
    const dateKey = normalizeDay(log.scheduled_time || log.created_at);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {});

export const calculateAdherencePercent = (taken = 0, total = 0) => {
  if (!total) return 0;
  return Math.round((taken / total) * 100);
};

export const buildDailyAdherenceData = (logs = [], days = 7) => {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(end, days - 1));
  const grouped = groupLogsByDate(logs);

  return eachDayOfInterval({ start, end }).map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayLogs = grouped[dateKey] || [];
    const taken = dayLogs.filter((item) => item.status === 'taken').length;
    const total = dayLogs.length;

    return {
      date: dateKey,
      label: format(day, 'MMM d'),
      taken,
      total,
      adherence: calculateAdherencePercent(taken, total),
    };
  });
};

export const buildWeeklySummary = (logs = []) => {
  const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
  const thisWeek = logs.filter((item) => toDate(item.scheduled_time) >= sevenDaysAgo);

  const taken = thisWeek.filter((item) => item.status === 'taken').length;
  const missed = thisWeek.filter((item) => item.status === 'missed').length;
  const total = thisWeek.length;

  return {
    taken,
    missed,
    total,
    adherenceRate: calculateAdherencePercent(taken, total),
  };
};

export const buildStatusPieData = (logs = []) => {
  const totals = logs.reduce(
    (acc, item) => {
      const status = item.status || 'pending';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += 1;
      return acc;
    },
    { taken: 0, missed: 0, pending: 0, rescheduled: 0 }
  );

  return [
    { name: 'Taken', key: 'taken', value: totals.taken },
    { name: 'Missed', key: 'missed', value: totals.missed },
    { name: 'Pending', key: 'pending', value: totals.pending },
    { name: 'Rescheduled', key: 'rescheduled', value: totals.rescheduled },
  ].filter((item) => item.value > 0);
};

export const calculateTakenStreak = (logs = []) => {
  const grouped = groupLogsByDate(logs);
  let streak = 0;
  let cursor = startOfDay(new Date());

  while (true) {
    const dateKey = format(cursor, 'yyyy-MM-dd');
    const dayLogs = grouped[dateKey] || [];

    if (!dayLogs.length) {
      if (isSameDay(cursor, new Date())) {
        cursor = subDays(cursor, 1);
        continue;
      }
      break;
    }

    const hasMissed = dayLogs.some((item) => item.status === 'missed');
    const hasTaken = dayLogs.some((item) => item.status === 'taken');

    if (hasMissed || !hasTaken) break;

    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
};

export const calculateAdherenceScore = (logs = []) => {
  const taken = logs.filter((item) => item.status === 'taken').length;
  const total = logs.length;
  return calculateAdherencePercent(taken, total);
};

export const buildAdherenceAnalytics = (logs = [], days = 30) => {
  const daily = buildDailyAdherenceData(logs, days);
  const weekly = buildWeeklySummary(logs);
  const statusPie = buildStatusPieData(logs);
  const streak = calculateTakenStreak(logs);
  const score = calculateAdherenceScore(logs);

  return {
    daily,
    weekly,
    statusPie,
    streak,
    score,
  };
};
