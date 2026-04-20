import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  connectGoogleCalendar,
  createGoogleMedicineEvents,
  getGoogleAuthUrl,
  getGoogleConnectionStatus,
  getUpcomingGoogleReminders,
} from '../services/googleCalendarService';

export const useGoogleConnectionStatus = (enabled = true) =>
  useQuery({
    queryKey: ['google-calendar', 'status'],
    queryFn: getGoogleConnectionStatus,
    retry: 0,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });

export const useConnectGoogleCalendar = () => {
  return useMutation({
    mutationFn: async () => {
      const { url } = await getGoogleAuthUrl();
      if (!url) throw new Error('Could not create Google OAuth URL.');
      window.location.assign(url);
      return true;
    },
    onError: (error) => toast.error(error.message || 'Failed to start Google OAuth flow'),
  });
};

export const useCompleteGoogleConnect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'status'] });
      toast.success('Google Calendar connected');
    },
    onError: (error) => toast.error(error.message || 'Failed to connect Google Calendar'),
  });
};

export const useCreateGoogleEvents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoogleMedicineEvents,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar', 'reminders'] });
      toast.success(`Created ${result?.remindersCreated || 0} Google reminder(s)`);
    },
    onError: (error) => toast.error(error.message || 'Failed to create Google Calendar reminders'),
  });
};

export const useUpcomingGoogleReminders = ({ familyId, enabled = true } = {}) => {
  const query = useQuery({
    queryKey: ['google-calendar', 'reminders'],
    queryFn: () => getUpcomingGoogleReminders(familyId),
    retry: 1,
    enabled: Boolean(enabled && familyId),
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
