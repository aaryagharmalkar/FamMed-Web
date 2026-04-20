import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bot, Bell, Home, LineChart, Pill } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FamilySwitcher from '../FamilySwitcher';

const mobileTabs = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/medicines', label: 'Medicines', icon: Pill },
  { to: '/reminders', label: 'Queue', icon: Bell },
  { to: '/analytics', label: 'Trends', icon: LineChart },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/chatbot', label: 'Assistant', icon: Bot },
];

const MainLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="hidden md:block">
        <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded((p) => !p)} />
      </div>
      <div className={sidebarExpanded ? 'pb-20 md:ml-60 md:pb-0' : 'pb-20 md:ml-16 md:pb-0'}>
        <Navbar />
        <main className="container-shell p-4 md:p-6 lg:p-8">
          <div className="space-y-8">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 px-2 py-2 backdrop-blur md:hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="mb-2">
          <FamilySwitcher compact />
        </div>
        <nav className="flex items-center justify-around">
          {mobileTabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[11px] ${isActive ? 'text-primary-600' : 'text-slate-500'}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
