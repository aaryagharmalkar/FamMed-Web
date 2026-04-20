import { memo } from 'react';
import { getReminderTime } from '../../utils/reminderHelpers';

const statusStyles = {
	pending: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
	taken: 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300',
	missed: 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-300',
	rescheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
};

const ReminderCard = ({ reminder, medicine, onTaken, onMissed, onRemindLater, isBusy = false }) => (
	<article className="card">
		<div className="flex items-center justify-between">
			<div>
				<h3 className="font-medium">{medicine?.name || reminder?.medicines?.name || 'Medicine'}</h3>
				<p className="text-xs" style={{ color: 'var(--muted)' }}>
					{getReminderTime(reminder) || 'No reminder set yet. Marking action creates one instantly.'}
				</p>
			</div>
			<span className={`rounded-full px-2 py-1 text-xs ${statusStyles[reminder?.status || 'pending']}`}>
				{reminder?.status || 'pending'}
			</span>
		</div>
		<div className="mt-3 flex flex-wrap gap-2">
			<button className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60" onClick={onTaken} type="button" disabled={isBusy}>Mark Taken</button>
			<button className="rounded-[12px] bg-danger-600 px-3 py-1.5 text-xs text-white disabled:opacity-60" onClick={onMissed} type="button" disabled={isBusy}>Missed</button>
			<button className="rounded-[12px] px-3 py-1.5 text-xs text-white disabled:opacity-60" style={{ background: 'var(--warn)' }} onClick={onRemindLater} type="button" disabled={isBusy}>Remind Later</button>
		</div>
	</article>
);

export default memo(ReminderCard);
