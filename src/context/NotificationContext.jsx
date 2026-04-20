import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthContext } from './AuthContext';

const chime = 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSAAAAAA';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, familyId } = useAuthContext();
  const [notifications, setNotifications] = useState([]);

  const mergeNotification = (incoming) => {
    if (!incoming?.id) return;
    setNotifications((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === incoming.id);
      if (existingIndex === -1) return [incoming, ...prev];
      const next = [...prev];
      next[existingIndex] = { ...next[existingIndex], ...incoming };
      return next;
    });
  };

  useEffect(() => {
    if (!user?.id) return undefined;

    const fetchNotifications = async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (familyId) {
        query = query.or(`profile_id.eq.${user.id},family_id.eq.${familyId}`);
      } else {
        query = query.eq('profile_id', user.id);
      }

      let { data, error } = await query;

      if (error && String(error.message || '').toLowerCase().includes('family_id')) {
        ({ data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }));
      }

      if (error) {
        console.error('Notification fetch failed:', error.message);
        setNotifications([]);
        return;
      }

      setNotifications(data || []);
    };

    fetchNotifications();

    const handleRealtimeNotification = (payload) => {
      if (payload.new) {
        mergeNotification(payload.new);
        const audio = new Audio(chime);
        audio.volume = 0.2;
        audio.play().catch(() => {});
      }
    };

    const personalChannel = supabase
      .channel('personal-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        handleRealtimeNotification
      )
      .subscribe();

    const familyChannel = familyId
      ? supabase
        .channel('family-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `family_id=eq.${familyId}`,
          },
          handleRealtimeNotification
        )
        .subscribe()
      : null;

    return () => {
      supabase.removeChannel(personalChannel);
      if (familyChannel) supabase.removeChannel(familyChannel);
    };
  }, [familyId, user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const clearAll = async () => {
    if (!user?.id) return;

    let query = supabase.from('notifications').update({ is_read: true }).eq('profile_id', user.id);

    if (familyId) {
      query = supabase.from('notifications').update({ is_read: true }).or(`profile_id.eq.${user.id},family_id.eq.${familyId}`);
    }

    const { error } = await query;
    if (error && String(error.message || '').toLowerCase().includes('family_id')) {
      await supabase.from('notifications').update({ is_read: true }).eq('profile_id', user.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const value = useMemo(
    () => ({ notifications, unreadCount, markAsRead, clearAll }),
    [notifications, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotificationContext must be used within NotificationProvider');
  return context;
};
