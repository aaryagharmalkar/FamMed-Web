import { useEffect } from 'react';
import { subDays } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import {
  getLatestPendingReminder,
  getMedicationLogs,
  updateMedicationStatus,
} from '../services/medicationLogService';
import { buildAdherenceAnalytics } from '../utils/adherenceAnalytics';

const medicationLogsQueryKey = (userId, from, to) => ['medication-logs', userId, from, to];

export const useMedicationLogs = ({ userId, from, to, enabled = true }) =>
  useQuery({
    queryKey: medicationLogsQueryKey(userId, from, to),
    queryFn: async () => {
      const { data, error } = await getMedicationLogs({ userId, from, to });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(enabled && userId),
  });

export const useLatestPendingReminder = ({ familyId, userId, enabled = true }) =>
  {
    const query = useQuery({
    queryKey: ['latest-pending-reminder', familyId, userId],
    queryFn: async () => {
      const { data, error } = await getLatestPendingReminder({ familyId, userId });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(enabled && familyId && userId),
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

export const useAdherenceAnalytics = ({ userId, days = 30, enabled = true }) => {
  const from = subDays(new Date(), days - 1).toISOString();
  const to = new Date().toISOString();

  return useQuery({
    queryKey: ['adherence-analytics', userId, days],
    queryFn: async () => {
      const { data, error } = await getMedicationLogs({ userId, from, to });
      if (error) throw error;

      const logsWithScheduledRemindersOnly = (data || []).filter(
        (log) => log?.reminders?.source !== 'on_demand'
      );

      return buildAdherenceAnalytics(logsWithScheduledRemindersOnly, days);
    },
    enabled: Boolean(enabled && userId),
  });
};

export const useUpdateMedicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reminder, status, rescheduleMinutes, rescheduleTo }) => {
      const { data, error } = await updateMedicationStatus({
        userId,
        reminder,
        status,
        rescheduleMinutes,
        rescheduleTo,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ userId, reminder, status }) => {
      const latestKey = ['latest-pending-reminder', reminder.family_id, userId];
      const analyticsKeys = queryClient
        .getQueryCache()
        .findAll({ queryKey: ['adherence-analytics', userId] })
        .map((entry) => entry.queryKey);

      await queryClient.cancelQueries({ queryKey: latestKey });
      await Promise.all(
        analyticsKeys.map((key) => queryClient.cancelQueries({ queryKey: key }))
      );

      const previousLatest = queryClient.getQueryData(latestKey);

      queryClient.setQueryData(latestKey, (current) => {
        if (!current || current.id !== reminder.id) return current;
        return {
          ...current,
          status,
        };
      });

      return { latestKey, previousLatest };
    },
    onSuccess: (_, variables) => {
      const { userId, reminder, status } = variables;
      queryClient.invalidateQueries({ queryKey: ['latest-pending-reminder', reminder.family_id, userId] });
      queryClient.invalidateQueries({ queryKey: ['adherence-analytics', userId] });
      queryClient.invalidateQueries({ queryKey: ['medication-logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['reminders', reminder.family_id] });

      if (status === 'taken') toast.success('Dose marked as taken');
      if (status === 'missed') toast.success('Dose marked as missed');
      if (status === 'rescheduled') toast.success('Reminder rescheduled');
    },
    onError: (error, _variables, context) => {
      if (context?.latestKey) {
        queryClient.setQueryData(context.latestKey, context.previousLatest);
      }
      toast.error(error.message || 'Unable to update reminder status');
    },
  });
};

export const useMedicationLogsRealtime = ({ userId, familyId, enabled = true }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId || !familyId || !supabase) return undefined;

    let logsChannel;
    let remindersChannel;

    // Delay subscription by one tick so React StrictMode dev remount does not spam transient WS warnings.
    const timer = window.setTimeout(() => {
      logsChannel = supabase
        .channel(`medication-logs-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medication_logs',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['medication-logs', userId] });
            queryClient.invalidateQueries({ queryKey: ['adherence-analytics', userId] });
            queryClient.invalidateQueries({ queryKey: ['latest-pending-reminder', familyId, userId] });
          }
        )
        .subscribe();

      remindersChannel = supabase
        .channel(`dashboard-reminders-${familyId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reminders',
            filter: `family_id=eq.${familyId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['latest-pending-reminder', familyId, userId] });
            queryClient.invalidateQueries({ queryKey: ['reminders', familyId] });
          }
        )
        .subscribe();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (logsChannel) supabase.removeChannel(logsChannel);
      if (remindersChannel) supabase.removeChannel(remindersChannel);
    };
  }, [enabled, familyId, queryClient, userId]);
};
