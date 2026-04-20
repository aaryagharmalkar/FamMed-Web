import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { generateAvatarInitials } from '../../lib/utils';

const links = [
  { to: '/', label: 'Today' },
  { to: '/medicines', label: 'Medicines' },
  { to: '/analytics', label: 'Trends' },
  { to: '/reminders', label: 'Dose Queue' },
  { to: '/notifications', label: 'Alerts' },
];

const Navbar = () => {
  const { profile, signOut, familyId, memberships = [], setActiveFamily } = useAuthContext();
  const { unreadCount } = useNotificationContext();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isFamilyMenuOpen, setIsFamilyMenuOpen] = useState(false);

  const families = useMemo(
    () => memberships
      .map((membership) => ({
        id: membership?.family_id || membership?.families?.id,
        name: membership?.families?.name || 'Unnamed family',
      }))
      .filter((item) => Boolean(item.id)),
    [memberships]
  );

  const activeFamilyName = useMemo(
    () => families.find((item) => item.id === familyId)?.name || families[0]?.name || 'No family',
    [families, familyId]
  );

  useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkStored);
    document.documentElement.classList.toggle('dark', isDarkStored);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsProfileOpen(false);
    setIsFamilyMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onOpenFamilySwitcher = () => {
      if (families.length > 1) setIsFamilyMenuOpen(true);
    };

    window.addEventListener('open-family-switcher', onOpenFamilySwitcher);
    return () => window.removeEventListener('open-family-switcher', onOpenFamilySwitcher);
  }, [families.length]);

  const avatarText = useMemo(() => generateAvatarInitials(profile?.full_name), [profile?.full_name]);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ borderColor: 'var(--border)', backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.85)' }}
    >
      <div className="container-shell flex items-center justify-between gap-3 px-2 py-3 md:px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="MedTrack home">
          <span className="rounded-full px-2 py-1 text-sm" style={{ background: 'var(--primary-soft)' }}>
            💊
          </span>
          <span className="font-heading text-xl font-bold" style={{ color: 'var(--primary)' }}>
            MedTrack
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative px-2 py-2 text-sm font-medium transition ${
                  isActive ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'
                }`
              }
            >
              {item.label}
              <span
                className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition"
                style={{ background: 'var(--accent)', opacity: location.pathname === item.to ? 1 : 0 }}
              />
              <span
                className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transition-transform group-hover:scale-x-100"
                style={{ background: 'var(--primary)' }}
              />
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              disabled={families.length <= 1}
              onClick={() => families.length > 1 && setIsFamilyMenuOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-semibold disabled:cursor-default"
              style={{
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                borderColor: 'transparent',
              }}
              aria-label="Active family"
            >
              <span>🏠</span>
              <span className="max-w-[140px] truncate">{activeFamilyName}</span>
              {families.length > 1 && <span>▾</span>}
            </button>

            {isFamilyMenuOpen && families.length > 1 && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border bg-white p-1 shadow-lg"
                style={{ borderColor: 'var(--border)' }}
              >
                {families.map((family) => (
                  <button
                    key={family.id}
                    type="button"
                    className={`block w-full rounded px-3 py-2 text-left text-sm ${family.id === familyId ? 'bg-primary-100 text-primary-700' : 'hover:bg-slate-100'}`}
                    onClick={() => {
                      setActiveFamily(family.id);
                      setIsFamilyMenuOpen(false);
                      toast.success(`Switched to ${family.name}`);
                    }}
                  >
                    {family.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            className="relative rounded-xl p-2"
            style={{ background: 'var(--surface-2)' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-danger-500 px-1.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="rounded-xl p-2"
            style={{ background: 'var(--surface-2)' }}
            onClick={toggleDark}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: 'var(--primary)' }}
              onClick={() => setIsProfileOpen((p) => !p)}
              aria-label="Profile menu"
            >
              {avatarText}
            </button>
            {isProfileOpen && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-2xl border bg-white p-1 shadow-lg"
                style={{ borderColor: 'var(--border)' }}
              >
                <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-slate-100">
                  Profile
                </Link>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => {
                    setIsProfileOpen(false);
                    toast('Settings are available in Profile page.');
                  }}
                >
                  Settings
                </button>
                <button
                  type="button"
                  className="block w-full rounded px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
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
            className="rounded-xl p-2 lg:hidden"
            style={{ background: 'var(--surface-2)' }}
            onClick={() => setIsMobileNavOpen((p) => !p)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="border-t bg-white px-4 py-3 lg:hidden" style={{ borderColor: 'var(--border)' }}>
          <nav className="space-y-1">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${
                    isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/chatbot"
              onClick={() => setIsMobileNavOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              Assistant
            </NavLink>
          </nav>
          <button
            type="button"
            className="btn-primary mt-3 w-full"
            style={{ background: 'var(--danger)' }}
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
