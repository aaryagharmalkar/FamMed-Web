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
  if (!reminder?.id || !reminder?.scheduled_time) return () => {};

  const now = new Date();
  const [hours, minutes] = reminder.scheduled_time.split(':').map(Number);
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
