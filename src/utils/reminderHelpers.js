/**
 * Canonical reminder time accessor.
 * Do not read reminder scheduled fields directly outside this helper.
 */
export function getReminderTime(reminder) {
  return (
    reminder?.scheduled_time ??
    reminder?.date_time ??
    reminder?.scheduled_at ??
    null
  );
}