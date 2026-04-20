import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock3, Flame, Pill } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useMedicines, useLowStockAlert } from '../hooks/useMedicines';
import { useReminders, useTodayReminders } from '../hooks/useReminders';
import {
	useAdherenceAnalytics,
	useMedicationLogsRealtime,
	useUpdateMedicationStatus,
} from '../hooks/useMedicationLogs';
import { getReminderTime } from '../utils/reminderHelpers';
import MedicineCard from '../components/medicine/MedicineCard';

const HOURS_TWO = 2 * 60 * 60 * 1000;

const parseScheduledDate = (reminder) => {
	const reminderTime = getReminderTime(reminder);
	if (!reminderTime) return null;

	if (typeof reminderTime === 'string' && reminderTime.includes('T')) {
		return new Date(reminderTime);
	}

	const [hours = 0, minutes = 0, seconds = 0] = String(reminderTime)
		.split(':')
		.map((part) => Number(part));
	const scheduled = new Date();
	scheduled.setHours(hours, minutes, seconds || 0, 0);
	return scheduled;
};

const Dashboard = () => {
	const { familyId, user, memberships = [] } = useAuthContext();
	const familyName = memberships.find((membership) => (membership?.family_id || membership?.families?.id) === familyId)?.families?.name || 'No family selected';
	const hasFamily = Boolean(familyId);

	const { data: assignedMedicines = [] } = useMedicines(familyId, { assignedTo: user?.id || '__pending__', isActive: true });
	const { data: reminders = [] } = useReminders(familyId);
	const { data: today = [] } = useTodayReminders(familyId);
	const { data: lowStock = [] } = useLowStockAlert(familyId);
	const { data: analytics } = useAdherenceAnalytics({ userId: user?.id, days: 30 });
	const updateMedicationStatus = useUpdateMedicationStatus();

	useMedicationLogsRealtime({
		userId: user?.id,
		familyId,
		enabled: Boolean(user?.id && hasFamily),
	});

	if (!hasFamily) {
		return (
			<section className="card space-y-4">
				<h1 className="text-2xl font-semibold">No active family selected</h1>
				<p className="text-sm" style={{ color: 'var(--muted)' }}>
					No active family selected. Please join or create a family.
				</p>
				<Link to="/family" className="btn-primary inline-flex w-fit items-center justify-center px-4 py-2">
					Go to Family Setup
				</Link>
			</section>
		);
	}

	const handleReminderAction = async (reminder, status) => {
		if (!reminder?.id || !user?.id) return;

		try {
			await updateMedicationStatus.mutateAsync({
				userId: user.id,
				reminder,
				status,
				rescheduleMinutes: 15,
			});
		} catch {
			toast.error('Failed to update medication status');
		}
	};

	const queueItems = (today.length ? today : reminders)
		.filter((item) => !['taken', 'missed'].includes(item?.status))
		.map((item) => ({
			...item,
			scheduledAt: parseScheduledDate(item),
		}))
		.filter((item) => item.scheduledAt instanceof Date && !Number.isNaN(item.scheduledAt.getTime()))
		.sort((a, b) => a.scheduledAt - b.scheduledAt);

	const now = new Date();
	const overdueItems = queueItems.filter((item) => item.scheduledAt < now);
	const dueNowItems = queueItems.filter((item) => item.scheduledAt >= now && item.scheduledAt - now <= HOURS_TWO);
	const upcomingItems = queueItems.filter((item) => item.scheduledAt - now > HOURS_TWO);

	const todayIso = new Date().toISOString().slice(0, 10);
	const todayMetrics = analytics?.daily?.find((item) => item.date === todayIso);
	const dosesTakenToday = todayMetrics?.taken || 0;
	const dosesTotalToday = todayMetrics?.total || queueItems.length || 0;

	const statCards = [
		{ title: 'Doses taken today', value: `${dosesTakenToday}/${dosesTotalToday || 0}`, icon: Pill, tone: 'var(--primary)' },
		{ title: 'Overdue right now', value: overdueItems.length, icon: AlertTriangle, tone: 'var(--danger)' },
		{ title: 'Current streak', value: `${analytics?.streak || 0} day(s)`, icon: Flame, tone: 'var(--warn)' },
	];

	const renderQueueItem = (item, section) => {
		const timeLabel = item.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const hoursOverdue = Math.max(1, Math.floor((now - item.scheduledAt) / (60 * 60 * 1000)));
		const borderColor = section === 'overdue' ? 'var(--danger)' : section === 'now' ? 'var(--primary)' : 'var(--border)';

		return (
			<article key={item.id} className="rounded-xl border-l-4 border p-3" style={{ borderLeftColor: borderColor, borderColor: 'var(--border)', background: section === 'upcoming' ? 'var(--surface-2)' : 'var(--surface)' }}>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<p className="text-base font-semibold">{item.medicines?.name || 'Medicine'}</p>
						<p className="text-xs" style={{ color: 'var(--muted)' }}>{item.medicines?.dosage || 'Dosage not set'}</p>
					</div>
					<div className="text-right">
						<span className="badge badge-primary">{timeLabel}</span>
						{section === 'overdue' && (
							<p className="mt-1 text-xs text-danger-600">{hoursOverdue} hour(s) overdue</p>
						)}
					</div>
				</div>

				{section !== 'upcoming' && (
					<div className="mt-3 flex flex-wrap justify-end gap-2">
						<button className="btn-accent min-h-[44px] px-4 py-2 text-sm disabled:opacity-60" type="button" onClick={() => handleReminderAction(item, 'taken')} disabled={updateMedicationStatus.isPending}>
							Taken
						</button>
						<button className="min-h-[44px] rounded-[12px] px-4 py-2 text-sm text-white disabled:opacity-60" style={{ background: 'var(--danger)' }} type="button" onClick={() => handleReminderAction(item, 'missed')} disabled={updateMedicationStatus.isPending}>
							Missed
						</button>
						<button className="min-h-[44px] rounded-[12px] px-4 py-2 text-sm text-white disabled:opacity-60" style={{ background: 'var(--warn)' }} type="button" onClick={() => handleReminderAction(item, 'rescheduled')} disabled={updateMedicationStatus.isPending}>
							Later
						</button>
					</div>
				)}
			</article>
		);
	};

	return (
		<section className="space-y-6">
			<div className="section-title card">
				<p className="badge badge-primary">Today</p>
				<h1 className="mt-3 text-3xl sm:text-4xl">Today's Actions</h1>
				<p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>What needs your attention right now</p>
				<p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>Showing data for: {familyName}</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{statCards.map((card) => (
					<article key={card.title} className="card feature-item">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-sm" style={{ color: 'var(--muted)' }}>{card.title}</p>
								<p className="mt-2 text-2xl font-semibold">{card.value}</p>
							</div>
							<span className="icon-box" style={{ background: `${card.tone}1c` }}>
								<card.icon size={20} color={card.tone} />
							</span>
						</div>
					</article>
				))}
			</div>

			{lowStock.length > 0 && (
				<article className="rounded-xl border-l-4 p-3" style={{ borderLeftColor: 'var(--warn)', borderColor: 'var(--border)', background: 'var(--surface)' }}>
					<p className="font-semibold">Low stock alert</p>
					<p className="text-sm" style={{ color: 'var(--muted)' }}>
						{lowStock.length} medicine(s) are running low. Refill soon.
					</p>
				</article>
			)}

			<div className="space-y-4">
				<h2 className="text-xl font-bold">My medicines</h2>
				{assignedMedicines.length === 0 ? (
					<article className="card">
						<p className="text-sm" style={{ color: 'var(--muted)' }}>
							No medicines are assigned to you yet.
						</p>
					</article>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{assignedMedicines.map((medicine) => (
							<MedicineCard key={medicine.id} medicine={medicine} />
						))}
					</div>
				)}
			</div>

			<div className="space-y-4">
				<h2 className="text-xl font-bold">Today's Queue</h2>

				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="badge badge-danger animate-pulse-soft">OVERDUE</span>
					</div>
					{overdueItems.length === 0 ? (
						<p className="text-sm" style={{ color: 'var(--muted)' }}>No overdue doses.</p>
					) : overdueItems.map((item) => renderQueueItem(item, 'overdue'))}
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="badge badge-primary">DUE NOW</span>
					</div>
					{dueNowItems.length === 0 ? (
						<p className="text-sm" style={{ color: 'var(--muted)' }}>No doses due in the next 2 hours.</p>
					) : dueNowItems.map((item) => renderQueueItem(item, 'now'))}
				</div>

				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}><Clock3 size={12} className="mr-1 inline" />UPCOMING</span>
					</div>
					{upcomingItems.length === 0 ? (
						<p className="text-sm" style={{ color: 'var(--muted)' }}>No upcoming doses left today.</p>
					) : upcomingItems.map((item) => renderQueueItem(item, 'upcoming'))}
				</div>
			</div>

			<Link to="/analytics" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
				📊 View 30-day adherence trends →
			</Link>
		</section>
	);
};

export default Dashboard;
