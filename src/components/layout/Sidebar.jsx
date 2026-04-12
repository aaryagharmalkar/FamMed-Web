import { motion } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';
import {
	Bot,
	ChevronLeft,
	ChevronRight,
	HeartPulse,
	Home,
	Pill,
	Users,
	UserCircle,
	Bell,
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

const navItems = [
	{ to: '/', label: 'Dashboard', icon: Home },
	{ to: '/medicines', label: 'Medicines', icon: Pill },
	{ to: '/reminders', label: 'Reminders', icon: Bell },
	{ to: '/family', label: 'Family', icon: Users },
	{ to: '/health-records', label: 'Health Records', icon: HeartPulse },
	{ to: '/chatbot', label: 'Chatbot', icon: Bot },
	{ to: '/profile', label: 'Profile', icon: UserCircle },
];

const Sidebar = ({ expanded, onToggle }) => {
	const { profile, signOut } = useAuthContext();

	return (
		<motion.aside
			animate={{ width: expanded ? 240 : 64 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
			className="fixed inset-y-0 left-0 z-50 hidden border-r border-slate-200 bg-white p-2 shadow-card dark:border-slate-700 dark:bg-slate-900 md:flex md:flex-col"
		>
			<div className="mb-4 flex items-center justify-between px-1 py-2">
				{expanded && <span className="text-sm font-semibold">Navigation</span>}
				<button type="button" onClick={onToggle} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
					{expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
				</button>
			</div>

			<nav className="flex-1 space-y-1">
				{navItems.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						title={!expanded ? label : undefined}
						className={({ isActive }) =>
							`flex items-center rounded-md px-2 py-2 text-sm ${isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
						}
					>
						<Icon size={18} />
						{expanded && <span className="ml-2">{label}</span>}
					</NavLink>
				))}
			</nav>

			<div className="border-t border-slate-200 pt-2 dark:border-slate-700">
				<Link to="/profile" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
					<span className="h-8 w-8 rounded-full bg-primary-600 text-center text-xs font-semibold leading-8 text-white">
						{profile?.full_name?.slice(0, 2).toUpperCase() || 'FM'}
					</span>
					{expanded && <span className="truncate">{profile?.full_name || 'Member'}</span>}
				</Link>
				<button
					type="button"
					className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
					onClick={async () => {
						await signOut();
					}}
				>
					{expanded ? 'Sign out' : 'Out'}
				</button>
			</div>
		</motion.aside>
	);
};

export default Sidebar;
