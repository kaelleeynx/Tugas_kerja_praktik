import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getPendingApprovals } from '../services/api';
import NotificationBell from './NotificationBell';

export default function Navbar({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user && user.role === 'owner') {
      const fetchPending = async () => {
        try {
          const response = await getPendingApprovals();
          const data = Array.isArray(response) ? response : (response.data || []);
          setPendingCount(Array.isArray(data) ? data.length : 0);
        } catch (error) {
          // Silently fail — notification count is non-critical
        }
      };
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-white via-blue-50/50 to-cyan-50/50 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800/60 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-4 z-50 shadow-sm shadow-black/5">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Toko Besi Serta Guna</h1>
        </div>
        <button 
          onClick={toggleTheme}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50"
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          )}
        </button>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <aside className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200/50 dark:border-gray-700/50 z-40 max-h-[calc(100vh-64px)] overflow-y-auto shadow-lg shadow-black/10">
          <nav className="flex flex-col p-4 gap-1">
            <MobileNavItem to="/dashboard" icon={<DashboardIcon size={20} />} label="Dashboard" />
            <MobileNavItem to="/transactions" icon={<PlusIcon size={20} />} label="Input Transaksi" />
            <MobileNavItem to="/pricelist" icon={<DollarIcon size={20} />} label="Daftar Barang" />
            
            {user && user.role === 'owner' && (
              <>
                <MobileNavItem to="/reports" icon={<FileIcon size={20} />} label="Laporan" />
                <MobileNavItem to="/users" icon={<UsersIcon size={20} />} label="Anggota" />
                <MobileNavItem to="/approvals" icon={<InboxIcon size={20} />} label="Inbox" badge={pendingCount} />
              </>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <MobileNavItem to="/settings" icon={<SettingsIcon size={20} />} label="Pengaturan" />

            <button 
              onClick={onLogout}
              className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium text-sm mt-2 border border-red-200 dark:border-red-900/30"
            >
              <LogoutIcon size={20} />
              Logout
            </button>
          </nav>
        </aside>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:h-screen md:w-20 md:bg-gray-900 dark:md:bg-gray-950 md:border-r md:border-gray-800/50 md:flex md:flex-col md:items-center md:py-8 md:gap-6 md:z-40">
        {/* Logo */}
        <div className="hidden md:w-12 md:h-12 md:rounded-xl md:bg-gradient-to-br md:from-cyan-500 md:via-blue-500 md:to-purple-600 md:flex md:items-center md:justify-center md:font-bold md:text-white md:text-lg md:shadow-lg md:shadow-cyan-500/30 md:cursor-pointer md:hover:shadow-cyan-500/50 md:transition-shadow md:duration-300">
          <DollarIcon size={24} />
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex md:flex-col md:gap-3 md:flex-1">
          <DesktopNavItem to="/dashboard" icon={<DashboardIcon size={24} />} title="Dashboard" />
          <DesktopNavItem to="/transactions" icon={<PlusIcon size={24} />} title="Input Transaksi" />
          <DesktopNavItem to="/pricelist" icon={<DollarIcon size={24} />} title="Daftar Barang" />
          
          {user && user.role === 'owner' && (
            <>
              <DesktopNavItem to="/reports" icon={<FileIcon size={24} />} title="Laporan" />
              <DesktopNavItem to="/users" icon={<UsersIcon size={24} />} title="Anggota" />
              <DesktopNavItem to="/approvals" icon={<InboxIcon size={24} />} title="Inbox" badge={pendingCount} />
            </>
          )}
        </nav>

        {/* Bottom Icons */}
        <div className="hidden md:flex md:flex-col md:gap-3 md:border-t md:border-gray-800/50 md:pt-4">
          <DesktopNavItem to="/settings" icon={<SettingsIcon size={24} />} title="Pengaturan" />

          <button 
            onClick={toggleTheme}
            className="w-12 h-12 rounded-lg text-gray-400 hover:text-amber-400 transition-all duration-200 flex items-center justify-center hover:bg-gray-700/50"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <MoonIcon size={24} /> : <SunIcon size={24} />}
          </button>

          <button 
            onClick={onLogout}
            className="w-12 h-12 rounded-lg text-gray-400 hover:text-red-400 transition-all duration-200 flex items-center justify-center hover:bg-gray-700/50"
            title="Logout"
          >
            <LogoutIcon size={24} />
          </button>
        </div>

        {/* User Avatar Bottom */}
        <div className="hidden md:mt-auto md:border-t md:border-gray-800/50 md:pt-4 md:w-full md:flex md:justify-center">
          {user && (
            <div className="md:w-12 md:h-12 md:rounded-xl md:bg-gradient-to-br md:from-cyan-400 md:to-blue-500 md:flex md:items-center md:justify-center md:font-bold md:text-white md:text-sm md:cursor-pointer md:hover:shadow-lg md:hover:shadow-cyan-500/40 md:transition-all md:duration-300" title={`${user.name} (${user.role})`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </aside>

      {/* Top Header Bar (Desktop) */}
      <header className="hidden md:fixed md:top-0 md:left-20 md:right-0 md:h-16 md:bg-gradient-to-r md:from-white md:via-blue-50/30 md:to-cyan-50/30 md:dark:from-gray-800 md:dark:via-gray-800/50 md:dark:to-gray-800/30 md:border-b md:border-gray-200/50 md:dark:border-gray-700/50 md:flex md:items-center md:justify-between md:px-6 md:z-40 md:backdrop-blur-sm md:shadow-sm md:shadow-black/5">
        <div className="md:flex md:items-center md:gap-4">
          <h1 className="md:text-xl md:font-bold text-gray-900 dark:text-gray-100">Toko Besi Serta Guna</h1>
        </div>

        <div className="md:flex md:items-center md:gap-6">
          <NotificationBell />
          {user && (
            <div className="md:text-right md:hidden lg:block md:border-l md:border-gray-200/50 md:dark:border-gray-700/50 md:pl-4">
              <div className="md:font-semibold md:text-gray-900 md:dark:text-white md:text-sm">{user.name}</div>
              <div className="md:text-xs md:text-gray-500 md:dark:text-gray-400 md:capitalize md:font-medium">{user.role}</div>
            </div>
          )}
        </div>
      </header>

      {/* Overlay when mobile sidebar is open */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}

// ─── Desktop Nav Item (NavLink-based) ────────────────────────────────────

function DesktopNavItem({ to, icon, title, badge }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `relative group w-12 h-12 rounded-lg transition-all duration-200 flex items-center justify-center ${
        isActive 
          ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
      }`}
      title={title}
    >
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── Mobile Nav Item (NavLink-based) ─────────────────────────────────────

function MobileNavItem({ to, icon, label, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium text-sm ${
        isActive 
          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      <span className="flex-shrink-0 w-5 h-5">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full px-2 py-1 font-bold shadow-md">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── Icon Components ─────────────────────────────────────────────────────

function DashboardIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );
}

function PlusIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"></path>
    </svg>
  );
}

function DollarIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}

function FileIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  );
}

function UsersIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}

function InboxIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function SettingsIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

function MoonIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );
}

function SunIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  );
}

function LogoutIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}