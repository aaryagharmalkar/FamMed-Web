import { useNotificationContext } from '../context/NotificationContext';
import { formatDate } from '../lib/utils';

const Notifications = () => {
  const { notifications, markAsRead, clearAll } = useNotificationContext();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button onClick={clearAll} type="button" className="rounded border px-3 py-1.5 text-sm">
          Mark all as read
        </button>
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-lg border p-4 ${notification.is_read ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800' : 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{notification.title}</h2>
              <span className="text-xs text-slate-500">{formatDate(notification.created_at, 'PP p')}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{notification.body}</p>
            {!notification.is_read && (
              <button className="mt-3 rounded bg-primary-600 px-3 py-1 text-xs text-white" type="button" onClick={() => markAsRead(notification.id)}>
                Mark read
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Notifications;
