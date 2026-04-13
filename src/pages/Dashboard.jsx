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
			{/* Action Required Banner removed */}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{statCards.map((card) => (
					<article key={card.title} className="rounded-xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60 hover:-translate-y-1 transition-transform duration-300">
						<p className="text-sm font-medium text-slate-500">{card.title}</p>
						<p className="mt-2 text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-400">{card.value}</p>
					</article>
				))}
			</div>

			<div className="grid gap-4 xl:grid-cols-3">
				<article className="rounded-xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60 xl:col-span-2">
					<h2 className="mb-4 text-lg font-semibold tracking-tight">Medication Adherence (7 days)</h2>
					<div className="h-[280px]">
						<ResponsiveContainer>
							<BarChart data={adherenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
								<XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
								<YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
								<Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
								<Bar dataKey="value" fill="url(#colorPv)" radius={[4, 4, 0, 0]} />
								<defs>
									<linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9}/>
										<stop offset="95%" stopColor="#4f46e5" stopOpacity={0.3}/>
									</linearGradient>
								</defs>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</article>

				<article className="rounded-xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60 flex flex-col items-center justify-center">
					<h2 className="mb-4 w-full text-left text-lg font-semibold tracking-tight">Form Distribution</h2>
					<div className="h-[240px] w-full">
						<ResponsiveContainer>
							<PieChart>
								<Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={5} fill="#14b8a6" />
								<Tooltip contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
							</PieChart>
						</ResponsiveContainer>
					</div>
				</article>
			</div>

			<article className="rounded-xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
				<h2 className="mb-4 text-lg font-semibold tracking-tight">Trends: Missed vs Taken (30 days)</h2>
				<div className="h-[280px]">
					<ResponsiveContainer>
						<LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
							<XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
							<YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
							<Tooltip contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
							<Line type="monotone" dataKey="taken" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
							<Line type="monotone" dataKey="missed" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</article>

			<div className="grid gap-4 lg:grid-cols-2">
				<article className="rounded-xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
					<h2 className="mb-4 text-lg font-semibold tracking-tight">Quick Actions</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						<Link className="flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-3 font-medium text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all" to="/medicines">Add Medicine</Link>
						<Link className="flex items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-medium text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all" to="/reminders">Set Reminder</Link>
						<Link className="flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-rose-400 px-4 py-3 font-medium text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all" to="/health-records">Upload Record</Link>
						<button onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))} className="flex items-center justify-center rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-3 font-medium text-white shadow-md hover:opacity-90 hover:shadow-lg transition-all dark:from-slate-600 dark:to-slate-800">Ask Chatbot</button>
					</div>
				</article>

				<article className="rounded-xl border border-white/20 bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/60">
					<h2 className="mb-4 text-lg font-semibold tracking-tight">Today's Schedule</h2>
					<div className="space-y-3">
						{today.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <p>No reminders scheduled for today.</p>
              </div>
            )}
						{today.slice(0, 10).map((item) => (
							<div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50 transition-colors hover:bg-slate-50 hover:dark:bg-slate-700">
								<div>
									<p className="font-semibold text-slate-800 dark:text-slate-200">{item.medicines?.name || 'Medicine'}</p>
									<p className="text-sm font-medium text-primary-600 dark:text-primary-400">{item.scheduled_time}</p>
								</div>
								<div className="flex gap-2">
									<button type="button" onClick={() => handleReminderAction(item.id, 'taken')} className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors">Taken</button>
									<button type="button" onClick={() => handleReminderAction(item.id, 'skipped')} className="rounded-md bg-slate-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-500 transition-colors">Skip</button>
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
