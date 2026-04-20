import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';
import { useMedicines } from '../hooks/useMedicines';
import { useReminders } from '../hooks/useReminders';
import { useUpdateMedicationStatus } from '../hooks/useMedicationLogs';
import { getNextScheduledTime } from '../utils/scheduleHelpers';
import { ensureReminder } from '../services/reminderService';
import { getReminderTime } from '../utils/reminderHelpers';

const HOURS_TWO = 2 * 60 * 60 * 1000;

const toScheduledDate = (reminder) => {
	const value = getReminderTime(reminder);
	if (!value) return null;

	if (typeof value === 'string' && value.includes('T')) return new Date(value);

	const [hours = 0, minutes = 0, seconds = 0] = String(value)
		.split(':')
		.map((part) => Number(part));
	const date = new Date();
	date.setHours(hours, minutes, seconds || 0, 0);
	return date;
};

const Reminders = () => {
	const { familyId, user, memberships = [] } = useAuthContext();
	const { data: reminders = [] } = useReminders(familyId);
	const { data: medicines = [] } = useMedicines(familyId);
	const updateMedicationStatus = useUpdateMedicationStatus();

	const familyName = memberships.find((membership) => (membership?.family_id || membership?.families?.id) === familyId)?.families?.name || 'No family selected';

	const list = useMemo(() => {
		const remindersByMedicineId = new Map();

		(reminders || []).forEach((item) => {
			if (!item?.medicine_id) return;
			if (!remindersByMedicineId.has(item.medicine_id)) {
				remindersByMedicineId.set(item.medicine_id, item);
			}
		});

		return (medicines || []).map((medicine) => ({
			medicine,
			reminder: remindersByMedicineId.get(medicine.id) || null,
		}));
	}, [medicines, reminders]);

	const queue = list
		.map(({ medicine, reminder }) => ({
			medicine,
			reminder,
			scheduledAt: toScheduledDate(reminder),
		}))
		.filter((item) => item.scheduledAt && !['taken', 'missed'].includes(item.reminder?.status))
		.sort((a, b) => a.scheduledAt - b.scheduledAt);

	const now = new Date();
	const overdue = queue.filter((item) => item.scheduledAt < now);
	const dueNow = queue.filter((item) => item.scheduledAt >= now && item.scheduledAt - now <= HOURS_TWO);
	const upcoming = queue.filter((item) => item.scheduledAt - now > HOURS_TWO);
	const remainingCount = overdue.length + dueNow.length;

	const ensureReminderForAction = async (medicine, reminder) => {
		if (reminder?.id) return reminder;
		const sourceScheduledTime = getNextScheduledTime(medicine);

		const { data, error } = await ensureReminder(
			medicine.id,
			familyId,
			sourceScheduledTime,
			medicine.assigned_to || user?.id,
			medicine.assigned_to || user?.id
		);

		if (error) throw error;
		return data;
	};

	const handleStatus = async ({ medicine, reminder, status }) => {
		try {
			const activeReminder = await ensureReminderForAction(medicine, reminder);
			await updateMedicationStatus.mutateAsync({
				userId: user?.id,
				reminder: {
					...activeReminder,
					medicine_id: activeReminder.medicine_id || medicine.id,
					family_id: activeReminder.family_id || familyId,
				},
				status,
				rescheduleMinutes: 15,
			});
		} catch (error) {
			toast.error(error.message || 'Could not update medicine status.');
		}
	};

	const renderQueueCard = ({ medicine, reminder, scheduledAt }, section) => {
		const labelTime = scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const hoursOverdue = Math.max(1, Math.floor((now - scheduledAt) / (60 * 60 * 1000)));
		const assignedName = reminder?.profiles?.full_name;
		const showAssigned = assignedName && reminder?.assigned_to && reminder.assigned_to !== user?.id;
		const leftColor = section === 'overdue' ? 'var(--danger)' : section === 'now' ? 'var(--primary)' : 'var(--border)';

		return (
			<article key={medicine.id} className="rounded-xl border-l-4 border p-3" style={{ borderLeftColor: leftColor, borderColor: 'var(--border)', background: section === 'upcoming' ? 'var(--surface-2)' : 'var(--surface)' }}>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-lg font-semibold">{medicine?.name || reminder?.medicines?.name || 'Medicine'}</p>
						<p className="text-sm" style={{ color: 'var(--muted)' }}>{medicine?.dosage || reminder?.medicines?.dosage || 'Dosage not set'} {medicine?.instructions ? `· ${medicine.instructions}` : ''}</p>
						{showAssigned && <p className="text-xs" style={{ color: 'var(--muted)' }}>Assigned to: {assignedName}</p>}
					</div>
					<div className="text-right">
						<span className="badge badge-primary">{labelTime}</span>
						{section === 'overdue' && <p className="mt-1 text-xs text-danger-600">{hoursOverdue} hours overdue</p>}
					</div>
				</div>

				{section !== 'upcoming' && (
					<div className="mt-3 flex flex-wrap justify-end gap-2">
						{section === 'overdue' ? (
							<>
								<button className="btn-accent min-h-[44px] px-4 py-2 text-sm disabled:opacity-60" type="button" onClick={() => handleStatus({ medicine, reminder, status: 'taken' })} disabled={updateMedicationStatus.isPending}>✅ Taken Anyway</button>
								<button className="min-h-[44px] rounded-[12px] bg-danger-600 px-4 py-2 text-sm text-white disabled:opacity-60" type="button" onClick={() => handleStatus({ medicine, reminder, status: 'missed' })} disabled={updateMedicationStatus.isPending}>❌ Mark Missed</button>
							</>
						) : (
							<>
								<button className="btn-accent min-h-[44px] px-4 py-2 text-sm disabled:opacity-60" type="button" onClick={() => handleStatus({ medicine, reminder, status: 'taken' })} disabled={updateMedicationStatus.isPending}>✅ Taken</button>
								<button className="min-h-[44px] rounded-[12px] px-4 py-2 text-sm text-white disabled:opacity-60" style={{ background: 'var(--warn)' }} type="button" onClick={() => handleStatus({ medicine, reminder, status: 'rescheduled' })} disabled={updateMedicationStatus.isPending}>⏰ Remind in 30 min</button>
								<button className="min-h-[44px] rounded-[12px] bg-danger-600 px-4 py-2 text-sm text-white disabled:opacity-60" type="button" onClick={() => handleStatus({ medicine, reminder, status: 'missed' })} disabled={updateMedicationStatus.isPending}>❌ Missed</button>
							</>
						)}
					</div>
				)}

				{section === 'upcoming' && (
					<div className="mt-2 text-right">
						<Link to={`/medicines/${medicine.id}`} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>[details]</Link>
					</div>
				)}
			</article>
		);
	};

	return (
		<section className="space-y-4">
			<div className="card section-title">
				<div>
					<p className="badge badge-primary">Execution</p>
					<h1 className="mt-2 text-3xl sm:text-4xl">Dose Queue · {remainingCount} remaining</h1>
					<p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Complete or reschedule today's doses</p>
					<p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>Showing data for: {familyName}</p>
				</div>
			</div>

			{queue.length === 0 ? (
				<article className="card text-center">
					<p className="text-lg font-semibold text-success-700">✅ All doses complete for today! Great work.</p>
					<Link to="/analytics" className="mt-2 inline-flex text-sm font-semibold" style={{ color: 'var(--primary)' }}>
						See your streak in Trends →
					</Link>
				</article>
			) : (
				<div className="space-y-4">
					<div className="space-y-2">
						<p className="badge badge-danger">🔴 OVERDUE</p>
						{overdue.length === 0 ? <p className="text-sm" style={{ color: 'var(--muted)' }}>No overdue doses.</p> : overdue.map((item) => renderQueueCard(item, 'overdue'))}
					</div>

					<div className="space-y-2">
						<p className="badge badge-primary">🔵 DUE NOW</p>
						{dueNow.length === 0 ? <p className="text-sm" style={{ color: 'var(--muted)' }}>No doses due in the next 2 hours.</p> : dueNow.map((item) => renderQueueCard(item, 'now'))}
					</div>

					<div className="space-y-2">
						<p className="badge" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>⬜ UPCOMING</p>
						{upcoming.length === 0 ? <p className="text-sm" style={{ color: 'var(--muted)' }}>No upcoming doses later today.</p> : upcoming.map((item) => renderQueueCard(item, 'upcoming'))}
					</div>
				</div>
			)}
		</section>
	);
};

export default Reminders;
