import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationContext } from '../context/NotificationContext';
import { formatDate } from '../lib/utils';

const Notifications = () => {
  const { notifications, markAsRead, clearAll } = useNotificationContext();
  const [showRecent, setShowRecent] = useState(false);

  const grouped = useMemo(() => {
    const items = notifications || [];
    const actionRequired = [];
    const upcoming = [];
    const recent = [];

    items.forEach((notification) => {
      const text = `${notification.title || ''} ${notification.body || ''}`.toLowerCase();
      const needsAction = /overdue|missed|low stock|urgent|failed|error/.test(text);
      const upcomingDose = /upcoming|due|scheduled|reminder/.test(text);

      if (needsAction && !notification.is_read) {
        actionRequired.push(notification);
        return;
      }

      if (upcomingDose && !notification.is_read) {
        upcoming.push(notification);
        return;
      }

      recent.push(notification);
    });

    return { actionRequired, upcoming, recent };
  }, [notifications]);

  const renderActionCard = (notification, section) => (
    <article
      key={notification.id}
      className="rounded-lg border p-4"
      style={{
        borderColor: section === 'action' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(14, 116, 144, 0.35)',
        background: section === 'action' ? 'rgba(254, 226, 226, 0.35)' : 'rgba(224, 242, 254, 0.35)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{notification.title}</h2>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(notification.created_at, 'PP p')}</span>
      </div>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{notification.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {section === 'action' ? (
          <Link to="/reminders" className="btn-accent px-3 py-2 text-sm">Take action now</Link>
        ) : (
          <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm text-white" style={{ background: 'var(--primary)' }}>View today's plan</Link>
        )}
        <button className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} type="button" onClick={() => markAsRead(notification.id)}>
          Mark read
        </button>
      </div>
    </article>
  );

  return (
    <section className="space-y-4">
      <div className="card section-title flex items-center justify-between">
        <div>
          <p className="badge badge-primary">Alerts</p>
          <h1 className="mt-2 text-2xl font-semibold">Notifications</h1>
        </div>
        <button onClick={clearAll} type="button" className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--border)' }}>
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        <article className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-danger-700">Action Required</h2>
            <span className="badge badge-danger">{grouped.actionRequired.length}</span>
          </div>
          {grouped.actionRequired.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No urgent alerts.</p>
          ) : (
            <div className="space-y-2">
              {grouped.actionRequired.map((notification) => renderActionCard(notification, 'action'))}
            </div>
          )}
        </article>

        <article className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>Upcoming</h2>
            <span className="badge badge-primary">{grouped.upcoming.length}</span>
          </div>
          {grouped.upcoming.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No upcoming reminders waiting.</p>
          ) : (
            <div className="space-y-2">
              {grouped.upcoming.map((notification) => renderActionCard(notification, 'upcoming'))}
            </div>
          )}
        </article>

        <article className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button type="button" className="text-sm font-semibold" style={{ color: 'var(--primary)' }} onClick={() => setShowRecent((value) => !value)}>
              {showRecent ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {showRecent && (
            <div className="mt-3 space-y-2">
              {grouped.recent.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No recent activity yet.</p>
              ) : (
                grouped.recent.slice(0, 12).map((notification) => (
                  <article key={notification.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{notification.title}</h3>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(notification.created_at, 'PP p')}</span>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{notification.body}</p>
                  </article>
                ))
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
};

export default Notifications;
