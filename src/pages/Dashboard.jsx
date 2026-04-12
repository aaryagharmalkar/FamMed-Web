import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart, Bar, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuthContext } from '../context/AuthContext';
import { useMedicines, useLowStockAlert } from '../hooks/useMedicines';
import { useLogReminderAction, useReminders, useTodayReminders } from '../hooks/useReminders';

const adherenceData = [
	{ day: 'Mon', value: 80 },
	{ day: 'Tue', value: 86 },
	{ day: 'Wed', value: 74 },
	{ day: 'Thu', value: 90 },
	{ day: 'Fri', value: 78 },
	{ day: 'Sat', value: 92 },
	{ day: 'Sun', value: 88 },
];

const trendData = [
	{ day: 'W1', taken: 22, missed: 4 },
	{ day: 'W2', taken: 26, missed: 3 },
	{ day: 'W3', taken: 24, missed: 5 },
	{ day: 'W4', taken: 27, missed: 2 },
];

const Dashboard = () => {
	const { familyId } = useAuthContext();
	const { data: medicines = [] } = useMedicines(familyId);
	const { data: reminders = [] } = useReminders(familyId);
	const { data: today = [] } = useTodayReminders(familyId);
	const { data: lowStock = [] } = useLowStockAlert(familyId);
	const logReminderAction = useLogReminderAction();
	const handleReminderAction = async (reminderId, action) => {
		try {
			await logReminderAction.mutateAsync({ reminderId, action });
		} catch {
			toast.error('Failed to log reminder action');
		}
	};


	const pieData = Object.values(
		medicines.reduce((acc, item) => {
			acc[item.form || 'other'] = acc[item.form || 'other'] || { name: item.form || 'other', value: 0 };
			acc[item.form || 'other'].value += 1;
			return acc;
		}, {})
	);

	const statCards = [
		{ title: 'Active Medicines', value: medicines.filter((m) => m.is_active).length },
		{ title: "Today's Reminders", value: `${today.length} total` },
		{ title: 'Low Stock Alerts', value: lowStock.length },
		{ title: 'Total Reminders', value: reminders.length },
	];

	return (
		<section className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{statCards.map((card) => (
					<article key={card.title} className="rounded-lg border bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800">
						<p className="text-sm text-slate-500">{card.title}</p>
						<p className="mt-2 text-2xl font-semibold">{card.value}</p>
					</article>
				))}
			</div>

			<div className="grid gap-4 xl:grid-cols-3">
				<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800 xl:col-span-2">
					<h2 className="mb-3 font-semibold">Medication adherence (7 days)</h2>
					<div className="h-56">
						<ResponsiveContainer>
							<BarChart data={adherenceData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="day" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="value" fill="#4f46e5" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</article>

				<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
					<h2 className="mb-3 font-semibold">Medicines by category</h2>
					<div className="h-56">
						<ResponsiveContainer>
							<PieChart>
								<Pie data={pieData} dataKey="value" nameKey="name" outerRadius={72} fill="#14b8a6" />
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</article>
			</div>

			<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
				<h2 className="mb-3 font-semibold">Missed vs taken (30 days)</h2>
				<div className="h-56">
					<ResponsiveContainer>
						<LineChart data={trendData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="day" />
							<YAxis />
							<Tooltip />
							<Line type="monotone" dataKey="taken" stroke="#10b981" strokeWidth={2} />
							<Line type="monotone" dataKey="missed" stroke="#ef4444" strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</article>

			<div className="grid gap-4 lg:grid-cols-2">
				<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
					<h2 className="mb-3 font-semibold">Quick actions</h2>
					<div className="grid gap-2 sm:grid-cols-2">
						<Link className="rounded bg-primary-600 px-3 py-2 text-center text-sm text-white" to="/medicines">Add Medicine</Link>
						<Link className="rounded bg-secondary-600 px-3 py-2 text-center text-sm text-white" to="/reminders">Set Reminder</Link>
						<Link className="rounded bg-accent-500 px-3 py-2 text-center text-sm text-white" to="/health-records">Upload Record</Link>
						<Link className="rounded bg-slate-700 px-3 py-2 text-center text-sm text-white" to="/chatbot">Ask Chatbot</Link>
					</div>
				</article>

				<article className="rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
					<h2 className="mb-3 font-semibold">Today's schedule</h2>
					<div className="space-y-2">
						{today.length === 0 && <p className="text-sm text-slate-500">No reminders for today.</p>}
						{today.slice(0, 10).map((item) => (
							<div key={item.id} className="flex items-center justify-between rounded border p-2 dark:border-slate-700">
								<div>
									<p className="text-sm font-medium">{item.medicines?.name || 'Medicine'}</p>
									<p className="text-xs text-slate-500">{item.scheduled_time}</p>
								</div>
								<div className="flex gap-2">
									<button type="button" onClick={() => handleReminderAction(item.id, 'taken')} className="rounded bg-success-600 px-2 py-1 text-xs text-white">Taken</button>
									<button type="button" onClick={() => handleReminderAction(item.id, 'skipped')} className="rounded bg-slate-500 px-2 py-1 text-xs text-white">Skip</button>
								</div>
							</div>
						))}
					</div>
				</article>
			</div>
		</section>
	);
};

export default Dashboard;
