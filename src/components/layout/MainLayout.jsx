import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="hidden md:block">
        <Sidebar expanded={sidebarExpanded} onToggle={() => setSidebarExpanded((p) => !p)} />
      </div>
      <div className={sidebarExpanded ? 'md:ml-60' : 'md:ml-16'}>
        <Navbar />
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
