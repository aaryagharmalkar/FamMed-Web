import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthContext } from './AuthContext';

const chime = 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSAAAAAA';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications(data || []);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setNotifications((prev) => [payload.new, ...prev]);
            const audio = new Audio(chime);
            audio.volume = 0.2;
            audio.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const clearAll = async () => {
    if (!user?.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('profile_id', user.id);
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
