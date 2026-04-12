import { useMemo, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useAdherenceStats, useLogReminderAction, useReminders } from '../hooks/useReminders';
import ReminderCard from '../components/reminders/ReminderCard';

const Reminders = () => {
	const { familyId, user } = useAuthContext();
	const [tab, setTab] = useState('today');
	const { data: reminders = [] } = useReminders(familyId);
	const logMutation = useLogReminderAction();
	const { data: adherence } = useAdherenceStats(user?.id, {});

	const list = useMemo(() => reminders, [reminders]);

	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-semibold">Reminders</h1>
				<div className="flex rounded border p-1 dark:border-slate-700">
					{['today', 'week', 'all'].map((item) => (
						<button key={item} type="button" className={`rounded px-3 py-1.5 text-sm ${tab === item ? 'bg-primary-600 text-white' : ''}`} onClick={() => setTab(item)}>
							{item === 'today' ? 'Today' : item === 'week' ? 'This Week' : 'All'}
						</button>
					))}
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<div className="space-y-3 lg:col-span-2">
					{list.map((reminder) => (
						<ReminderCard
							key={reminder.id}
							reminder={reminder}
							onTaken={(id) => logMutation.mutate({ reminderId: id, action: 'taken' })}
							onSkip={(id) => logMutation.mutate({ reminderId: id, action: 'skipped' })}
							onSnooze={(id) => logMutation.mutate({ reminderId: id, action: 'snoozed', notes: 'Snoozed 15 min' })}
						/>
					))}
				</div>

				<aside className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
					<h2 className="font-semibold">Adherence stats</h2>
					<div className="mt-3 space-y-2 text-sm">
						<p>Weekly adherence: {adherence?.adherenceRate || 0}%</p>
						<p>Taken: {adherence?.taken || 0}</p>
						<p>Missed: {adherence?.missed || 0}</p>
					</div>
				</aside>
			</div>
		</section>
	);
};

export default Reminders;
