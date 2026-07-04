import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sun, Moon, Bell, Menu } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { unreadCount, fetchNotifications, setupSocketListener } = useNotificationStore();

  useEffect(() => {
    // Sync theme on initial boot
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchNotifications();
    setupSocketListener();
  }, [fetchNotifications, setupSocketListener]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Convert path to page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path === '/kanban') return 'Kanban Boards';
    if (path === '/tasks') return 'All Tasks List';
    if (path === '/calendar') return 'Deadlines Calendar';
    if (path === '/analytics') return 'Performance Analytics';
    if (path === '/notifications') return 'User Notifications';
    if (path === '/profile') return 'My User Profile';
    if (path === '/admin') return 'System Administrator Panel';
    if (path.startsWith('/tasks/')) return 'Task Specifications';
    return 'System Portal';
  };

  return (
    <header className="h-16 border-b border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-8">
      {/* Title */}
      <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
        {getPageTitle()}
      </h2>

      {/* Action shortcuts */}
      <div className="flex items-center gap-4">
        {/* Dark / Light Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex items-center justify-center text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
          aria-label="Toggle Theme Mode"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications Icon shortcut */}
        <Link
          to="/notifications"
          className="w-10 h-10 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex items-center justify-center text-slate-555 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-extrabold text-white">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
export default Navbar;
