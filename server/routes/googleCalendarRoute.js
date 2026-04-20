import express from 'express';
import { adminSupabase } from '../lib/adminSupabaseClient.js';
import { requireUser } from '../middleware/requireUser.js';
import {
  exchangeGoogleCode,
  getCalendarClientForUser,
  getGoogleAuthUrl,
  getGoogleConnectionStatus,
  persistCalendarIdentity,
  storeGoogleTokens,
} from '../services/googleCalendarService.js';
import { buildCalendarEventTemplates, buildReminderRows } from '../utils/scheduleHelpers.js';

const router = express.Router();

router.get('/auth-url', requireUser, async (req, res) => {
  try {
    const url = getGoogleAuthUrl({ userId: req.user.id });
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create Google OAuth URL.' });
  }
});

router.get('/status', requireUser, async (req, res) => {
  try {
    const status = await getGoogleConnectionStatus({ userId: req.user.id });
    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to check Google connection status.' });
  }
});

router.post('/connect', requireUser, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'Missing OAuth authorization code.' });
    }

    const tokens = await exchangeGoogleCode({ code });
    await storeGoogleTokens({ userId: req.user.id, tokens });

    const { oauthClient } = await getCalendarClientForUser({ userId: req.user.id });
    await persistCalendarIdentity({ userId: req.user.id, oauthClient });

    return res.status(200).json({ connected: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to connect Google Calendar.' });
  }
});

router.post('/create-event', requireUser, async (req, res) => {
  try {
    if (!adminSupabase) {
      return res.status(500).json({ error: 'Supabase admin client is not configured.' });
    }

    const {
      medicineId,
      familyId,
      name,
      dosage,
      instructions,
      frequency,
      duration,
      timeSlots,
      startDate,
      timezone,
    } = req.body || {};

    if (!name || !dosage) {
      return res.status(400).json({ error: 'Medicine name and dosage are required.' });
    }

    const frequencyPerDay = Number.parseInt(frequency, 10) || 1;
    const durationDays = Number.parseInt(duration, 10) || 1;

    const { calendar } = await getCalendarClientForUser({ userId: req.user.id });
    const templates = buildCalendarEventTemplates({
      frequencyPerDay,
      durationDays,
      timeSlots,
      startDate,
      timezone,
    });

    const createdEvents = [];

    const upsertReminderForGoogleEvent = async (row) => {
      const { data: existing, error: existingError } = await adminSupabase
        .from('reminders')
        .select('id')
        .eq('medicine_id', row.medicine_id)
        .eq('family_id', row.family_id)
        .eq('user_id', row.user_id)
        .eq('scheduled_time', row.scheduled_time)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        const { error: updateError } = await adminSupabase
          .from('reminders')
          .update({
            event_id: row.event_id,
            google_event_id: row.google_event_id,
            assigned_to: row.assigned_to,
            is_active: true,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        return;
      }

      const { error: insertError } = await adminSupabase.from('reminders').insert(row);
      if (insertError) throw insertError;
    };

    for (const template of templates) {
      let googleEventId = null;

      try {
        const eventResponse = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `Take ${name}`,
            description: [
              `Dosage: ${dosage}`,
              instructions ? `Instructions: ${instructions}` : null,
              `Frequency: ${frequencyPerDay} time(s)/day for ${durationDays} day(s)`,
            ]
              .filter(Boolean)
              .join('\n'),
            start: { dateTime: template.startIso, timeZone: template.timezone },
            end: { dateTime: template.endIso, timeZone: template.timezone },
            recurrence: [template.recurrenceRule],
          },
        });

        googleEventId = eventResponse?.data?.id;

        const reminderRows = buildReminderRows({
          medicineId,
          familyId,
          userId: req.user.id,
          eventId: googleEventId,
          timeSlot: template.timeSlot,
          durationDays,
          startDate,
        });

        for (const row of reminderRows) {
          await upsertReminderForGoogleEvent(row);
        }

        createdEvents.push({ eventId: googleEventId, htmlLink: eventResponse?.data?.htmlLink, timeSlot: template.timeSlot });
      } catch (error) {
        if (googleEventId) {
          try {
            await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
          } catch (deleteError) {
            console.error('Failed to rollback Google Calendar event:', deleteError.message);
          }
        }

        throw error;
      }
    }

    return res.status(200).json({ createdEvents, remindersCreated: createdEvents.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create Google Calendar events.' });
  }
});

router.delete('/event/:eventId', requireUser, async (req, res) => {
  try {
    const { eventId } = req.params || {};
    if (!eventId) {
      return res.status(400).json({ error: 'Missing Google event id.' });
    }

    const { calendar } = await getCalendarClientForUser({ userId: req.user.id });
    await calendar.events.delete({ calendarId: 'primary', eventId });
    return res.status(200).json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to delete Google Calendar event.' });
  }
});

router.get('/reminders', requireUser, async (req, res) => {
  try {
    if (!adminSupabase) {
      return res.status(500).json({ error: 'Supabase admin client is not configured.' });
    }

    const loadGoogleReminders = async () => {
      const now = new Date().toISOString();

      const primaryQuery = adminSupabase
        .from('reminders')
        .select('id, medicine_id, event_id, google_event_id, date_time, scheduled_time, medicines(name, dosage)')
        .eq('user_id', req.user.id)
        .not('google_event_id', 'is', null)
        .gte('date_time', now)
        .order('date_time', { ascending: true })
        .limit(50);

      const { data, error } = await primaryQuery;
      if (!error) return { data, error: null };

      const fallbackMessage = String(error.message || '').toLowerCase();
      if (!fallbackMessage.includes('date_time')) {
        return { data, error };
      }

      return adminSupabase
        .from('reminders')
        .select('id, medicine_id, event_id, google_event_id, scheduled_time, medicines(name, dosage)')
        .eq('user_id', req.user.id)
        .not('event_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
    };

    const { data, error } = await loadGoogleReminders();

    if (error) throw error;

    return res.status(200).json({ reminders: data || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch Google reminders.' });
  }
});

export default router;
