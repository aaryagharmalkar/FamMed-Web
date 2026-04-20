import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const googleApi = axios.create({
  baseURL: apiBase,
  timeout: 10000,
});

const normalizeApiError = (error, fallback) => {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;
  return new Error(message);
};

const getAuthHeader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You need to be logged in to use Google Calendar.');
  }

  return { Authorization: `Bearer ${session.access_token}` };
};

export const getGoogleAuthUrl = async () => {
  try {
    const headers = await getAuthHeader();
    const { data } = await googleApi.get('/api/google/auth-url', { headers });
    return data;
  } catch (error) {
    throw normalizeApiError(error, 'Could not load Google authorization URL.');
  }
};

export const connectGoogleCalendar = async (code) => {
  try {
    const headers = await getAuthHeader();
    const { data } = await googleApi.post('/api/google/connect', { code }, { headers });
    return data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to connect Google Calendar.');
  }
};

export const getGoogleConnectionStatus = async () => {
  try {
    const headers = await getAuthHeader();
    const { data } = await googleApi.get('/api/google/status', { headers });
    return data;
  } catch (error) {
    throw normalizeApiError(error, 'Unable to check Google Calendar connection.');
  }
};

export const createGoogleMedicineEvents = async (payload) => {
  try {
    const headers = await getAuthHeader();
    const { data } = await googleApi.post('/api/google/create-event', payload, { headers });
    return data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to create Google Calendar events.');
  }
};

export const getUpcomingGoogleReminders = async (familyId) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) return [];

    let query = supabase
      .from('reminders')
      .select('id, medicine_id, family_id, user_id, scheduled_time, google_event_id, event_id, medicines(name, dosage)')
      .eq('user_id', userId)
      .or('google_event_id.not.is.null,event_id.not.is.null')
      .order('scheduled_time', { ascending: true })
      .limit(50);

    if (familyId) {
      query = query.eq('family_id', familyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch Google reminders.');
  }
};

export const deleteGoogleCalendarEventById = async (eventId) => {
  if (!eventId) return { deleted: false };

  try {
    const headers = await getAuthHeader();
    const { data } = await googleApi.delete(`/api/google/event/${encodeURIComponent(eventId)}`, { headers });
    return data;
  } catch (error) {
    throw normalizeApiError(error, 'Failed to delete Google Calendar event.');
  }
};
