import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, NavLink } from 'react-router-dom';
import { Bell, Menu, Moon, Pill, Sun } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { generateAvatarInitials } from '../../lib/utils';

const links = [
	{ to: '/', label: 'Dashboard' },
	{ to: '/medicines', label: 'Medicines' },
	{ to: '/reminders', label: 'Reminders' },
	{ to: '/family', label: 'Family' },
	{ to: '/health-records', label: 'Health Records' },
];

const Navbar = () => {
	const { profile, signOut } = useAuthContext();
	const { unreadCount } = useNotificationContext();
	const [isDark, setIsDark] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

	useEffect(() => {
		const isDarkStored = localStorage.getItem('theme') === 'dark';
		setIsDark(isDarkStored);
		document.documentElement.classList.toggle('dark', isDarkStored);
	}, []);

	const avatarText = useMemo(() => generateAvatarInitials(profile?.full_name), [profile?.full_name]);

	const toggleDark = () => {
		const next = !isDark;
		setIsDark(next);
		localStorage.setItem('theme', next ? 'dark' : 'light');
		document.documentElement.classList.toggle('dark', next);
	};

	return (
		<header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
			<div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 md:px-6">
				<Link to="/" className="flex items-center gap-2" aria-label="FamMed home">
					<span className="rounded-full bg-primary-100 p-2 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
						<Pill size={16} />
					</span>
					<span className="font-semibold">FamMed</span>
				</Link>

				<nav className="hidden items-center gap-2 lg:flex">
					{links.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								`rounded-md px-3 py-2 text-sm ${isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>

				<div className="flex items-center gap-2">
					<Link
						to="/notifications"
						className="relative rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
						aria-label="Notifications"
					>
						<Bell size={18} />
						{unreadCount > 0 && (
							<span className="absolute -right-1 -top-1 rounded-full bg-danger-500 px-1.5 text-xs text-white">
								{unreadCount}
							</span>
						)}
					</Link>
					<button type="button" className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleDark} aria-label="Toggle dark mode">
						{isDark ? <Sun size={18} /> : <Moon size={18} />}
					</button>
					<div className="relative">
						<button
							type="button"
							className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white"
							onClick={() => setIsProfileOpen((p) => !p)}
							aria-label="Profile menu"
						>
							{avatarText}
						</button>
						{isProfileOpen && (
							<div className="absolute right-0 mt-2 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
								<Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
									Profile
								</Link>
								<button
									type="button"
									className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
									onClick={() => {
										setIsProfileOpen(false);
										toast('Settings are available in Profile page.');
									}}
								>
									Settings
								</button>
								<button
									type="button"
									className="block w-full rounded px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
									onClick={async () => {
										setIsProfileOpen(false);
										await signOut();
									}}
								>
									Sign Out
								</button>
							</div>
						)}
					</div>
					<button
						type="button"
						className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
						onClick={() => setIsMobileNavOpen((p) => !p)}
						aria-label="Open menu"
					>
						<Menu size={18} />
					</button>
				</div>
			</div>
			{isMobileNavOpen && (
				<div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
					<nav className="space-y-1">
						{links.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								onClick={() => setIsMobileNavOpen(false)}
								className={({ isActive }) =>
									`block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
					<button
						type="button"
						className="mt-3 w-full rounded bg-danger-600 px-3 py-2 text-sm text-white"
						onClick={async () => {
							setIsMobileNavOpen(false);
							await signOut();
						}}
					>
						Sign Out
					</button>
				</div>
			)}
		</header>
	);
};

export default Navbar;
