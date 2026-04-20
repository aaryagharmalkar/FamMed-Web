import { useEffect } from 'react';
import { isToday, parseISO } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createReminder,
  getAdherenceStats,
  getReminders,
  getTodayReminders,
  logReminderAction,
} from '../services/reminderService';
import { supabase } from '../lib/supabaseClient';
import { showBrowserNotification } from '../lib/notifications';
import { getReminderTime } from '../utils/reminderHelpers';

const chime = 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSAAAAAA';

export const useReminders = (familyId) =>
  {
    const query = useQuery({
    queryKey: ['reminders', familyId],
    queryFn: async () => {
      const { data, error } = await getReminders(familyId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(familyId),
  });

    if (!familyId) {
      return {
        ...query,
        data: [],
        isLoading: false,
        error: new Error('No active family'),
      };
    }

    return query;
  };

export const useTodayReminders = (familyId) =>
  {
    const query = useQuery({
    queryKey: ['reminders', 'today', familyId],
    queryFn: async () => {
      const { data, error } = await getTodayReminders(familyId);
      if (error) throw error;
      return data.filter((item) => item?.created_at ? isToday(parseISO(item.created_at)) : true);
    },
    enabled: Boolean(familyId),
  });

    if (!familyId) {
      return {
        ...query,
        data: [],
        isLoading: false,
        error: new Error('No active family'),
      };
    }

    return query;
  };

export const useCreateReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await createReminder(payload);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', data.family_id] });
      toast.success('Reminder created');
    },
    onError: (error) => toast.error(error.message || 'Failed to create reminder'),
  });
};

export const useLogReminderAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reminderId, action, notes }) => {
      const { data, error } = await logReminderAction(reminderId, action, notes);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-logs'] });
      toast.success('Action logged');
    },
    onError: (error) => toast.error(error.message || 'Failed to log action'),
  });
};

export const useAdherenceStats = (profileId, dateRange) =>
  useQuery({
    queryKey: ['adherence-stats', profileId, dateRange],
    queryFn: async () => {
      const { data, error } = await getAdherenceStats(profileId, dateRange);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(profileId),
  });

export const useReminderScheduler = (familyId) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!familyId || !supabase) return undefined;

    let channel;

    // Delay subscription by one tick so React StrictMode dev remount does not spam transient WS warnings.
    const timer = window.setTimeout(() => {
      channel = supabase
        .channel(`reminders-${familyId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reminders', filter: `family_id=eq.${familyId}` },
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['reminders', familyId] });

            const next = payload.new;
            const reminderTime = getReminderTime(next);
            if (!reminderTime || typeof reminderTime !== 'string') return;

            const [h, m] = reminderTime.split(':').map(Number);
            const now = new Date();
            if (now.getHours() === h && Math.abs(now.getMinutes() - m) <= 1) {
              showBrowserNotification('Medicine Reminder', `Take your medicine now`);
              toast.success('Take your medicine now', { duration: 10000 });

              const audio = new Audio(chime);
              audio.volume = 0.25;
              audio.play().catch(() => {});
            }
          }
        )
        .subscribe();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [familyId, queryClient]);
};
