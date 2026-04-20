import { endOfDay, startOfDay } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';
import { deleteGoogleCalendarEventById } from './googleCalendarService';

// Migration note for developers:
// -- ALTER TABLE reminders ADD COLUMN IF NOT EXISTS google_event_id TEXT;
// -- ALTER TABLE reminders ADD COLUMN IF NOT EXISTS source TEXT;

const isMissingReminderSourceColumnError = (error) =>
  /could not find the 'source' column of 'reminders' in the schema cache/i.test(String(error?.message || ''));

const wrapReminderServiceError = (error) =>
  new Error(`[reminderService] ${error?.message || 'Unknown Supabase error'}`);

const toDbScheduledTime = (value) => {
  if (!value) {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  }

  if (typeof value === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return value.length === 5 ? `${value}:00` : value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  }

  return parsed.toTimeString().slice(0, 8);
};

export const getReminders = async (familyId) => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, medicines(name, dosage), profiles:assigned_to(full_name, avatar_url)')
      .eq('family_id', familyId)
      .order('scheduled_time', { ascending: true });
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getRemindersByMedicine = async (medicineId) => {
  try {
    const { data, error } = await supabase.from('reminders').select('*').eq('medicine_id', medicineId);
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const createReminder = async (reminderData) => {
  try {
    const {
      scheduled_time,
      date_time,
      scheduled_at,
      ...rest
    } = reminderData || {};

    const payload = {
      ...rest,
      scheduled_time: toDbScheduledTime(scheduled_time || date_time || scheduled_at),
    };

    let { data, error } = await supabase.from('reminders').insert(payload).select('*').single();

    if (error && isMissingReminderSourceColumnError(error) && Object.hasOwn(payload, 'source')) {
      const withoutSource = { ...payload };
      delete withoutSource.source;
      ({ data, error } = await supabase.from('reminders').insert(withoutSource).select('*').single());
    }

    if (error) throw wrapReminderServiceError(error);
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateReminder = async (id, updates) => {
  try {
    const { data, error } = await supabase.from('reminders').update(updates).eq('id', id).select('*').single();
    if (error) throw wrapReminderServiceError(error);
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteReminder = async (id) => {
  return deleteReminderAndCalendarEvent(id);
};

export const deleteReminderAndCalendarEvent = async (reminderId) => {
  try {
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .select('id, google_event_id, event_id')
      .eq('id', reminderId)
      .maybeSingle();

    if (reminderError) throw wrapReminderServiceError(reminderError);

    const googleEventId = reminder?.google_event_id || reminder?.event_id;
    if (googleEventId) {
      await deleteGoogleCalendarEventById(googleEventId);
    }

    const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
    if (error) throw wrapReminderServiceError(error);

    return handleServiceSuccess(true);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const findReminderForMedicine = async (medicineId, sourceScheduledTime) => {
  try {
    const normalizedTime = toDbScheduledTime(sourceScheduledTime);
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('medicine_id', medicineId)
      .eq('scheduled_time', normalizedTime)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw wrapReminderServiceError(error);
    return handleServiceSuccess(data || null);
  } catch (error) {
    return handleServiceError(error);
  }
};

/**
 * Reminder types:
 * SCHEDULED: created with a real planned schedule during medicine/reminder setup.
 * ON_DEMAND: created at action time when no matching scheduled reminder exists.
 */
export const ensureReminder = async (medicineId, familyId, sourceScheduledTime, assignedTo = null, userId = null) => {
  try {
    const { data: existing, error: existingError } = await findReminderForMedicine(medicineId, sourceScheduledTime);
    if (existingError) throw existingError;
    if (existing) return handleServiceSuccess(existing);

    if (!sourceScheduledTime) {
      console.warn('ensureReminder: sourceScheduledTime missing, creating on-demand reminder using current time.');
    }

    const scheduledTime = sourceScheduledTime || new Date().toISOString();
    const { data, error } = await createReminder({
      medicine_id: medicineId,
      family_id: familyId,
      assigned_to: assignedTo,
      user_id: userId || assignedTo,
      scheduled_time: scheduledTime,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      is_active: true,
      notification_method: ['in-app'],
      source: 'on_demand',
    });

    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const logReminderAction = async (reminderId, action, notes = '') => {
  try {
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .select('id, medicine_id')
      .eq('id', reminderId)
      .single();
    if (reminderError) throw wrapReminderServiceError(reminderError);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw wrapReminderServiceError(userError);

    const payload = {
      reminder_id: reminderId,
      medicine_id: reminder?.medicine_id,
      scheduled_at: new Date().toISOString(),
      action,
      notes,
      logged_by: user?.id,
      logged_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('reminder_logs').insert(payload).select('*').single();
    if (error) throw wrapReminderServiceError(error);

    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getReminderLogs = async (reminderId, dateRange = {}) => {
  try {
    let query = supabase.from('reminder_logs').select('*').eq('reminder_id', reminderId);
    if (dateRange.from) query = query.gte('scheduled_at', dateRange.from);
    if (dateRange.to) query = query.lte('scheduled_at', dateRange.to);
    const { data, error } = await query.order('scheduled_at', { ascending: false });
    if (error) throw error;
    return handleServiceSuccess(data || []);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getAdherenceStats = async (profileId, dateRange = {}) => {
  try {
    const from = dateRange.from || startOfDay(new Date()).toISOString();
    const to = dateRange.to || endOfDay(new Date()).toISOString();

    const { data, error } = await supabase
      .from('reminder_logs')
      .select('action, logged_by, scheduled_at')
      .eq('logged_by', profileId)
      .gte('scheduled_at', from)
      .lte('scheduled_at', to);

    if (error) throw error;

    const totals = (data || []).reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.action === 'taken') acc.taken += 1;
        if (row.action === 'missed') acc.missed += 1;
        if (row.action === 'skipped') acc.skipped += 1;
        return acc;
      },
      { total: 0, taken: 0, missed: 0, skipped: 0 }
    );

    return handleServiceSuccess({
      ...totals,
      adherenceRate: totals.total ? Math.round((totals.taken / totals.total) * 100) : 0,
    });
  } catch (error) {
    return handleServiceError(error);
  }
};

export const getTodayReminders = async (familyId) => {
  try {
    const { data, error } = await getReminders(familyId);
    if (error) throw error;
    return handleServiceSuccess(data?.filter((r) => r.is_active) || []);
  } catch (error) {
    return handleServiceError(error);
  }
};
