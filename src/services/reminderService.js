import { endOfDay, startOfDay } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { handleServiceError, handleServiceSuccess } from './serviceHelpers';

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
    const { data, error } = await supabase.from('reminders').insert(reminderData).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const updateReminder = async (id, updates) => {
  try {
    const { data, error } = await supabase.from('reminders').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return handleServiceSuccess(data);
  } catch (error) {
    return handleServiceError(error);
  }
};

export const deleteReminder = async (id) => {
  try {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
    return handleServiceSuccess(true);
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
    if (reminderError) throw reminderError;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;

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
    if (error) throw error;

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
