import { format } from 'date-fns';
import { AlarmClock, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { getReminderTime } from '../../utils/reminderHelpers';

const statusStyles = {
  pending: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  taken: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
  missed: 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
  rescheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const toDateFromReminderTime = (value) => {
  if (!value) return new Date();
  if (typeof value !== 'string') return new Date(value);
  if (value.includes('T')) return new Date(value);

  const now = new Date();
  const [hours = 0, minutes = 0, seconds = 0] = value.split(':').map((part) => Number(part));
  now.setHours(hours, minutes, seconds, 0);
  return now;
};

const DashboardReminderCard = ({ reminder, onTaken, onMissed, onRemindLater, isBusy = false }) => {
  if (!reminder) {
    return (
      <article className="card">
        <h2 className="text-lg font-semibold">Current Reminder</h2>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>No pending reminders right now.</p>
      </article>
    );
  }

  const scheduledAt = toDateFromReminderTime(getReminderTime(reminder));
  const overdue = scheduledAt.getTime() < Date.now() && (reminder.status || 'pending') === 'pending';

  return (
    <article className="card relative overflow-hidden">
      <div className="absolute right-4 top-4">
        <span className={`badge ${overdue ? 'badge-danger animate-pulse-soft' : 'badge-success'}`}>
          {overdue ? 'Due now' : 'On track'}
        </span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Current Reminder</h2>
          <p className="mt-2 text-base font-medium">{reminder.medicines?.name || 'Medicine'}</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{reminder.medicines?.dosage || 'Dosage not set'}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--primary)' }}>
            <AlarmClock size={14} />
            {format(scheduledAt, 'EEE, MMM d • hh:mm a')}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[reminder.status || 'pending']}`}>
          {reminder.status || 'pending'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          className="btn-accent inline-flex items-center justify-center gap-2 px-3 py-2 text-sm disabled:opacity-60"
          disabled={isBusy}
          onClick={onTaken}
        >
          <CheckCircle2 size={15} />
          Taken
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: 'var(--danger)' }}
          disabled={isBusy}
          onClick={onMissed}
        >
          <XCircle size={15} />
          Missed
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: 'var(--warn)' }}
          disabled={isBusy}
          onClick={onRemindLater}
        >
          <Clock3 size={15} />
          Remind Later
        </button>
      </div>
    </article>
  );
};

export default DashboardReminderCard;
