import { getReminderTime } from '../utils/reminderHelpers';

const activeIntervals = new Map();

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
};

export const showBrowserNotification = (title, body, icon) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;
  return new Notification(title, { body, icon });
};

export const scheduleLocalReminder = (reminder) => {
  const reminderTime = getReminderTime(reminder);
  if (!reminder?.id || !reminderTime) return () => {};

  const now = new Date();
  let hours = 0;
  let minutes = 0;

  if (typeof reminderTime === 'string' && reminderTime.includes('T')) {
    const parsed = new Date(reminderTime);
    hours = parsed.getHours();
    minutes = parsed.getMinutes();
  } else {
    [hours, minutes] = String(reminderTime).split(':').map(Number);
  }

  const triggerAt = new Date();
  triggerAt.setHours(hours || 0, minutes || 0, 0, 0);
  if (triggerAt < now) triggerAt.setDate(triggerAt.getDate() + 1);

  const firstDelay = triggerAt.getTime() - now.getTime();

  const timeoutId = setTimeout(() => {
    showBrowserNotification('Medicine Reminder', reminder?.title || 'Time to take medicine');
    const intervalId = setInterval(() => {
      showBrowserNotification('Medicine Reminder', reminder?.title || 'Time to take medicine');
    }, 24 * 60 * 60 * 1000);

    activeIntervals.set(reminder.id, intervalId);
  }, firstDelay);

  return () => {
    clearTimeout(timeoutId);
    const intervalId = activeIntervals.get(reminder.id);
    if (intervalId) {
      clearInterval(intervalId);
      activeIntervals.delete(reminder.id);
    }
  };
};
