import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getPendingApprovals } from '../services/api';
import NotificationBell from './NotificationBell';

// ─── Nav config ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/dashboard',    icon: 'dashboard',    label: 'Dashboard' },
  { to: '/transactions', icon: 'plus',         label: 'Input Transaksi' },
  { to: '/pricelist',    icon: 'package',      label: 'Daftar Barang' },
];

const OWNER_NAV_ITEMS = [
  { to: '/reports',   icon: 'file',  label: 'Laporan' },
  { to: '/users',     icon: 'users', label: 'Anggota' },
  { to: '/approvals', icon: 'inbox', label: 'Inbox', badge: true },
];

// ─── Main Component ───────────────────────────────────────────────────────

export default function Navbar({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role === 'owner') {
      let abortController = null;
      let isRunning = false;

      const fetchPending = async () => {
        if (isRunning) return;
        isRunning = true;
        abortController = new AbortController();

        try {
          const response = await getPendingApprovals(abortController.signal);
          const data = Array.isArray(response) ? response : (response.data || []);
          setPendingCount(Array.isArray(data) ? data.length : 0);
        } catch (err) {
          if (err?.name === 'AbortError' || err?.name === 'CanceledError') return;
        } finally {
          isRunning = false;
        }
      };

      // Stagger by 3s — Dashboard fires at 0s, NotificationBell at 1.5s, Approvals at 3s
      const initialDelay = setTimeout(fetchPending, 3000);
      const interval = setInterval(fetchPending, 35000);
      return () => {
        clearTimeout(initialDelay);
        clearInterval(interval);
        abortController?.abort();
      };
    }
  }, [user]);

  const allNavItems = [
    ...NAV_ITEMS,
    ...(user?.role === 'owner' ? OWNER_NAV_ITEMS : []),
  ];

  return (
    <>
      {/* ── Mobile Header ─────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-50
        bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]
        flex items-center justify-between px-4">

        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
          className="p-2 rounded-[var(--radius-default)] text-[var(--text-muted)]
            hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
        >
          {sidebarOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        {/* Brand */}
        <span className="font-bold text-base text-[var(--text-main)] tracking-tight">
          Toko Besi Serta Guna
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Aktifkan dark mode' : 'Aktifkan light mode'}
          className="p-2 rounded-[var(--radius-default)] text-[var(--text-muted)]
            hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
        >
          {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
        </button>
      </header>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 top-16 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────── */}
      {sidebarOpen && (
        <aside className="md:hidden fixed top-16 left-0 right-0 z-40
          bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]
          max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col p-3 gap-0.5">
            {allNavItems.map((item) => (
              <MobileNavItem
                key={item.to}
                to={item.to}
                icon={<NavIcon name={item.icon} size={18} />}
                label={item.label}
                badge={item.badge ? pendingCount : 0}
              />
            ))}

            <div className="my-2 border-t border-[var(--border-subtle)]" />

            <MobileNavItem
              to="/settings"
              icon={<NavIcon name="settings" size={18} />}
              label="Pengaturan"
            />

            <button
              onClick={onLogout}
              className="mt-1 w-full flex items-center gap-3 px-3 py-2.5
                rounded-[var(--radius-default)] text-sm font-medium
                text-[var(--status-danger)] border border-[var(--status-danger-bg)]
                hover:bg-[var(--status-danger-bg)] transition-colors"
            >
              <NavIcon name="logout" size={18} />
              Logout
            </button>
          </nav>
        </aside>
      )}

      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 z-50 flex-col
        bg-[var(--bg-app)] border-r border-[var(--border-subtle)]">

        {/* Logo mark */}
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-subtle)]">
          <div className="w-9 h-9 rounded-[var(--radius-card)] flex items-center justify-center
            bg-[var(--brand)] text-white font-bold text-sm select-none">
            TB
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1 px-2 py-3">
          {allNavItems.map((item) => (
            <DesktopNavItem
              key={item.to}
              to={item.to}
              icon={<NavIcon name={item.icon} size={20} />}
              title={item.label}
              badge={item.badge ? pendingCount : 0}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col gap-1 px-2 py-3 border-t border-[var(--border-subtle)]">
          <DesktopNavItem
            to="/settings"
            icon={<NavIcon name="settings" size={20} />}
            title="Pengaturan"
          />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            className="w-full h-10 flex items-center justify-center rounded-[var(--radius-default)]
              text-[var(--text-muted)] hover:text-[var(--text-main)]
              hover:bg-[var(--bg-surface)] transition-colors"
          >
            {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full h-10 flex items-center justify-center rounded-[var(--radius-default)]
              text-[var(--text-muted)] hover:text-[var(--status-danger)]
              hover:bg-[var(--status-danger-bg)] transition-colors"
          >
            <NavIcon name="logout" size={20} />
          </button>
        </div>

        {/* User avatar */}
        {user && (
          <div className="px-2 pb-4 flex justify-center">
            <div
              title={`${user.name} (${user.role})`}
              className="w-9 h-9 rounded-[var(--radius-card)] flex items-center justify-center
                bg-[var(--brand-muted)] border border-[var(--brand)] text-[var(--brand)]
                font-bold text-sm cursor-default select-none"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </aside>

      {/* ── Desktop Topbar ────────────────────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 left-20 right-0 h-16 z-50
        bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]
        items-center justify-between px-6">

        {/* Brand name */}
        <h1 className="text-base font-bold text-[var(--text-main)] tracking-tight">
          Toko Besi Serta Guna
        </h1>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <NotificationBell />

          {user && (
            <div className="pl-4 border-l border-[var(--border-subtle)] text-right">
              <p className="text-sm font-semibold text-[var(--text-main)] leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-[var(--text-muted)] capitalize leading-tight mt-0.5">
                {user.role}
              </p>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

// ─── Desktop Nav Item ─────────────────────────────────────────────────────

function DesktopNavItem({ to, icon, title, badge = 0 }) {
  return (
    <NavLink
      to={to}
      title={title}
      className={({ isActive }) =>
        `relative w-full h-10 flex items-center justify-center
         rounded-[var(--radius-default)] transition-colors
         ${isActive
           ? 'bg-[var(--brand-muted)] text-[var(--brand)] border-l-[3px] border-[var(--brand)]'
           : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
         }`
      }
    >
      {icon}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
          flex items-center justify-center rounded-full
          bg-[var(--status-danger)] text-white text-[10px] font-bold leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── Mobile Nav Item ──────────────────────────────────────────────────────

function MobileNavItem({ to, icon, label, badge = 0 }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-default)]
         text-sm font-medium transition-colors
         ${isActive
           ? 'bg-[var(--brand-muted)] text-[var(--brand)] border-l-[3px] border-[var(--brand)]'
           : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]'
         }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center
          rounded-[var(--radius-sm)] bg-[var(--status-danger)] text-white
          text-[10px] font-bold leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

// ─── Icon Router ──────────────────────────────────────────────────────────

function NavIcon({ name, size = 20 }) {
  const props = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case 'plus':
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case 'package':
      return (
        <svg {...props}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'file':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'inbox':
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...props}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      );
    default:
      return null;
  }
}

function MenuIcon({ size = 24 }) { return <NavIcon name="menu" size={size} />; }
function XIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function MoonIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SunIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
