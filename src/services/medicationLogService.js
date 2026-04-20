import { addMinutes, format, parseISO, set } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';
import { getReminderTime } from '../utils/reminderHelpers';

const toTimestampFromReminder = (reminder) => {
  const reminderTime = getReminderTime(reminder);
  if (reminderTime) return new Date(reminderTime);

  const now = new Date();
  const [hours = 0, minutes = 0, seconds = 0] = (reminderTime || '00:00:00')
    .split(':')
    .map((part) => Number(part));

  return set(now, { hours, minutes, seconds, milliseconds: 0 });
};

const toMinuteKey = (value) => format(value, "yyyy-MM-dd'T'HH:mm");

const findClosestPendingReminder = (reminders = [], logs = []) => {
  const now = new Date();

  const loggedKeys = new Set(
    logs
      .filter((item) => ['taken', 'missed', 'rescheduled'].includes(item.status))
      .map((item) => `${item.reminder_id}-${toMinuteKey(parseISO(item.scheduled_time))}`)
  );

  const candidates = reminders
    .filter((item) => item?.is_active)
    .map((item) => ({ ...item, _scheduledAt: toTimestampFromReminder(item) }))
    .filter((item) => !loggedKeys.has(`${item.id}-${toMinuteKey(item._scheduledAt)}`));

  if (!candidates.length) return null;

  const upcoming = candidates
    .filter((item) => item._scheduledAt >= now)
    .sort((a, b) => a._scheduledAt - b._scheduledAt)[0];

  if (upcoming) return upcoming;

  const overdue = candidates
    .filter((item) => item._scheduledAt < now)
    .sort((a, b) => b._scheduledAt - a._scheduledAt)[0];

  return overdue || null;
};

export const getMedicationLogs = async ({ userId, from, to }) => {
  try {
    let query = supabase
      .from('medication_logs')
      .select('*, medicines(name, dosage), reminders(scheduled_time)')
      .eq('user_id', userId)
      .order('scheduled_time', { ascending: false });

    if (from) query = query.gte('scheduled_time', from);
    if (to) query = query.lte('scheduled_time', to);

    const { data, error } = await query;
    if (error) throw error;

    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getLatestPendingReminder = async ({ familyId, userId }) => {
  try {
    const { data: reminders, error: remindersError } = await supabase
      .from('reminders')
      .select('id, medicine_id, family_id, assigned_to, user_id, scheduled_time, is_active, medicines(name, dosage)')
      .eq('family_id', familyId)
      .eq('is_active', true);

    if (remindersError) throw remindersError;

    const from = new Date();
    from.setHours(0, 0, 0, 0);

    const { data: logs, error: logsError } = await supabase
      .from('medication_logs')
      .select('id, reminder_id, scheduled_time, status')
      .eq('user_id', userId)
      .gte('scheduled_time', from.toISOString())
      .order('scheduled_time', { ascending: false });

    if (logsError) throw logsError;

    const matchedReminders = (reminders || []).filter((item) => {
      if (item.user_id) return item.user_id === userId;
      if (item.assigned_to) return item.assigned_to === userId;
      return true;
    });

    const nextReminder = findClosestPendingReminder(matchedReminders, logs || []);

    if (!nextReminder) return handleServiceSuccess(null);

    return handleServiceSuccess({
      ...nextReminder,
      scheduled_at: nextReminder._scheduledAt.toISOString(),
      status: 'pending',
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const upsertMedicationLog = async ({
  userId,
  medicineId,
  reminderId,
  scheduledTime,
  status,
  takenAt = null,
}) => {
  try {
    const payload = {
      user_id: userId,
      medicine_id: medicineId,
      reminder_id: reminderId,
      scheduled_time: scheduledTime,
      status,
      taken_at: takenAt,
    };

    const { data, error } = await supabase
      .from('medication_logs')
      .upsert(payload, { onConflict: 'user_id,reminder_id,scheduled_time' })
      .select('*, medicines(name, dosage)')
      .single();

    if (error) throw error;

    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const createRescheduledReminder = async ({
  reminder,
  minutes = 15,
  rescheduleTo,
}) => {
  try {
    const targetTime = rescheduleTo ? new Date(rescheduleTo) : addMinutes(new Date(), minutes);

    const [hours, mins, secs] = format(targetTime, 'HH:mm:ss').split(':');

    const payload = {
      medicine_id: reminder.medicine_id,
      family_id: reminder.family_id,
      assigned_to: reminder.assigned_to || null,
      user_id: reminder.user_id || reminder.assigned_to || null,
      scheduled_time: `${hours}:${mins}:${secs}`,
      is_active: true,
      notification_method: ['in-app'],
      days_of_week: [targetTime.getDay()],
    };

    const { data, error } = await supabase.from('reminders').insert(payload).select('*').single();
    if (error) throw error;

    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateMedicationStatus = async ({
  userId,
  reminder,
  status,
  rescheduleMinutes = 15,
  rescheduleTo,
}) => {
  try {
    if (!userId) throw new Error('User is required.');
    if (!reminder?.id || !reminder?.medicine_id) throw new Error('Reminder data is incomplete.');

    const scheduledAt = getReminderTime(reminder) || toTimestampFromReminder(reminder).toISOString();

    const takenAt = status === 'taken' ? new Date().toISOString() : null;

    const { data: log, error: logError } = await upsertMedicationLog({
      userId,
      medicineId: reminder.medicine_id,
      reminderId: reminder.id,
      scheduledTime: scheduledAt,
      status,
      takenAt,
    });

    if (logError) throw logError;

    let rescheduledReminder = null;
    if (status === 'rescheduled') {
      const { data, error } = await createRescheduledReminder({
        reminder,
        minutes: rescheduleMinutes,
        rescheduleTo,
      });

      if (error) throw error;
      rescheduledReminder = data;
    }

    return handleServiceSuccess({ log, rescheduledReminder });
  } catch (error) {
    return handleServiceError(error);
  }
};
