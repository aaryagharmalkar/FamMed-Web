import { memo } from 'react';

const statusStyles = {
	pending: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
	taken: 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300',
	missed: 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300',
	skipped: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const ReminderCard = ({ reminder, onTaken, onSkip, onSnooze }) => (
	<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
		<div className="flex items-center justify-between">
			<div>
				<h3 className="font-medium">{reminder.medicines?.name || 'Medicine'}</h3>
				<p className="text-xs text-slate-500">{reminder.scheduled_time}</p>
			</div>
			<span className={`rounded-full px-2 py-1 text-xs ${statusStyles[reminder.status || 'pending']}`}>
				{reminder.status || 'pending'}
			</span>
		</div>
		<div className="mt-3 flex flex-wrap gap-2">
			<button className="rounded bg-success-600 px-2 py-1 text-xs text-white" onClick={() => onTaken(reminder.id)} type="button">Mark Taken</button>
			<button className="rounded bg-slate-500 px-2 py-1 text-xs text-white" onClick={() => onSkip(reminder.id)} type="button">Skip</button>
			<button className="rounded bg-accent-500 px-2 py-1 text-xs text-white" onClick={() => onSnooze(reminder.id, 15)} type="button">Snooze</button>
		</div>
	</article>
);

export default memo(ReminderCard);
