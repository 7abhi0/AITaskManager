import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard,
  Trello,
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  Bell,
  User,
  Shield,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'Kanban Board', path: '/kanban', icon: Trello, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'Task List', path: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'Notifications', path: '/notifications', icon: Bell, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'My Profile', path: '/profile', icon: User, roles: ['ADMIN', 'TEAM_LEAD', 'MEMBER'] },
    { name: 'Admin Panel', path: '/admin', icon: Shield, roles: ['ADMIN'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 border-r border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300">
      {/* Brand logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200/50 dark:border-slate-800/60">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20">
          A
        </div>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          AI Task Manager
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-850 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User Profile Summary */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/60 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
            alt="avatar"
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-850 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-150 truncate leading-tight">{user?.name}</p>
            <span className="text-[10px] font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
              {user?.role}
            </span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-950 transition-all duration-200 text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
