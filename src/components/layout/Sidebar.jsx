import { motion } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';
import {
	Bot,
	Bell,
	ChevronLeft,
	ChevronRight,
	HeartPulse,
	Home,
	LineChart,
	Pill,
	Users,
	UserCircle,
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useFamilyMembers } from '../../hooks/useFamily';
import FamilySwitcher from '../FamilySwitcher';

const navItems = [
	{ to: '/', label: 'Today', subtitle: 'What needs action', icon: Home },
	{ to: '/medicines', label: 'Medicines', subtitle: 'Treatment plans', icon: Pill },
	{ to: '/reminders', label: 'Dose Queue', subtitle: 'Mark doses', icon: Bell },
	{ to: '/analytics', label: 'Trends', subtitle: 'Adherence history', icon: LineChart },
	{ to: '/family', label: 'Family', subtitle: 'Members & roles', icon: Users },
	{ to: '/notifications', label: 'Alerts', subtitle: 'Notifications', icon: Bell },
	{ to: '/health-records', label: 'Health Records', subtitle: 'Files & records', icon: HeartPulse },
	{ to: '/profile', label: 'Profile', subtitle: 'Your account', icon: UserCircle },
];

const Sidebar = ({ expanded, onToggle }) => {
	const { user, profile, signOut, familyId, memberships = [] } = useAuthContext();
	const { data: members = [] } = useFamilyMembers(familyId);
	const currentMembership = memberships.find((membership) => (membership?.family_id || membership?.families?.id) === familyId);
	const familyName = currentMembership?.families?.name || 'No family selected';
	const role = currentMembership?.role || 'member';
	const displayName =
		profile?.full_name ||
		user?.user_metadata?.full_name ||
		user?.user_metadata?.name ||
		user?.email?.split('@')[0] ||
		'Member';

	return (
		<motion.aside
			animate={{ width: expanded ? 240 : 64 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
			className="fixed inset-y-0 left-0 z-50 hidden border-r p-2 md:flex md:flex-col"
			style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
		>
			<div className="mb-4 flex items-center justify-between px-1 py-2">
				{expanded && (
					<div>
						<p className="font-heading text-sm font-extrabold" style={{ color: 'var(--primary)' }}>MedTrack</p>
						<p className="text-xs" style={{ color: 'var(--muted)' }}>Family clinic dashboard</p>
					</div>
				)}
				<button type="button" onClick={onToggle} className="rounded-lg p-1" style={{ background: 'var(--surface-2)' }}>
					{expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
				</button>
			</div>

			<div className="mb-3 px-1">
				{expanded ? (
					<div className="rounded-[10px] p-3" style={{ background: 'var(--surface-2)' }}>
						<div className="flex items-start justify-between gap-2">
							<div>
								<p className="font-semibold">🏠 {familyName}</p>
								<p className="text-xs" style={{ color: 'var(--muted)' }}>
									{members.length} members · {role.charAt(0).toUpperCase() + role.slice(1)}
								</p>
							</div>
							{memberships.length > 1 && (
								<button
									type="button"
									onClick={() => window.dispatchEvent(new CustomEvent('open-family-switcher'))}
									className="text-xs font-semibold"
									style={{ color: 'var(--primary)' }}
								>
									Switch →
								</button>
							)}
						</div>
					</div>
				) : (
					<FamilySwitcher compact={!expanded} />
				)}
			</div>

			<nav className="flex-1 space-y-1">
				{navItems.map(({ to, label, subtitle, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						title={!expanded ? label : undefined}
						className={({ isActive }) =>
							`flex items-center rounded-xl px-2 py-2 text-sm transition ${isActive ? 'border-l-[3px] bg-primary-100 text-primary-700' : 'text-slate-700 hover:bg-slate-100'}`
						}
					>
						<Icon size={18} />
						{expanded && (
							<span className="ml-2">
								<span className="block leading-tight">{label}</span>
								<span className="block text-[11px] leading-tight" style={{ color: 'var(--muted)' }}>{subtitle}</span>
							</span>
						)}
					</NavLink>
				))}

				<div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
					{expanded && (
						<p className="px-2 text-[11px] font-semibold tracking-[1.5px]" style={{ color: 'var(--muted)' }}>
							SUPPORT
						</p>
					)}
					<NavLink
						to="/chatbot"
						title={!expanded ? 'Assistant' : undefined}
						className={({ isActive }) =>
							`mt-1 flex items-center rounded-xl px-2 py-2 text-sm transition ${isActive ? 'border-l-[3px] bg-primary-100 text-primary-700' : 'text-slate-700 hover:bg-slate-100'}`
						}
					>
						<Bot size={18} />
						{expanded && (
							<span className="ml-2">
								<span className="block leading-tight">Assistant</span>
								<span className="block text-[11px] leading-tight" style={{ color: 'var(--muted)' }}>Ask questions</span>
							</span>
						)}
					</NavLink>
				</div>
			</nav>

			<div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
				<Link to="/profile" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
					<span className="h-8 w-8 rounded-full text-center text-xs font-semibold leading-8 text-white" style={{ background: 'var(--primary)' }}>
						{displayName.slice(0, 2).toUpperCase() || 'FM'}
					</span>
					{expanded && <span className="truncate">{displayName}</span>}
				</Link>
				<button
					type="button"
					className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
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
