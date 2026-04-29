import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  getPendingApprovals: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../components/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

import Navbar from '../../components/Navbar';
import { getPendingApprovals } from '../../services/api';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';

function renderNavbar({ storedUser = null, initialTheme = 'light', onLogout = vi.fn(), initialPath = '/dashboard' } = {}) {
  if (storedUser) localStorage.setItem('activeUser', JSON.stringify(storedUser));
  if (initialTheme) localStorage.setItem('theme', initialTheme);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider><ThemeProvider><Navbar onLogout={onLogout} /></ThemeProvider></AuthProvider>
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    vi.clearAllMocks();
    getPendingApprovals.mockResolvedValue([]);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, media: query, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('rendering', () => {
    it('should render the app title', async () => {
      renderNavbar({ storedUser: { id: 1, name: 'Zandi', role: 'staff', token: 'tok' } });
      await waitFor(() => expect(screen.getAllByText(/Toko Besi Serta Guna/i).length).toBeGreaterThan(0));
    });

    it('should render notification bell', async () => {
      renderNavbar({ storedUser: { id: 1, name: 'Zandi', role: 'staff', token: 'tok' } });
      await waitFor(() => expect(screen.getByTestId('notification-bell')).toBeTruthy());
    });
  });

  describe('role-based navigation', () => {
    it('should show owner-only nav items for owner role', async () => {
      const user = userEvent.setup();
      renderNavbar({ storedUser: { id: 1, name: 'Owner', role: 'owner', token: 'tok' } });
      await waitFor(() => expect(screen.getAllByText(/Toko Besi Serta Guna/i).length).toBeGreaterThan(0));
      await user.click(screen.getAllByRole('button')[0]);
      await waitFor(() => {
        expect(screen.getAllByText(/Laporan/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Anggota/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Inbox/i).length).toBeGreaterThan(0);
      });
    });

    it('should NOT show owner-only nav items for staff role', async () => {
      renderNavbar({ storedUser: { id: 2, name: 'Staff', role: 'staff', token: 'tok' } });
      await waitFor(() => {
        expect(screen.queryByText(/Laporan/i)).toBeNull();
        expect(screen.queryByText(/Anggota/i)).toBeNull();
        expect(screen.queryByText(/Inbox/i)).toBeNull();
      });
    });

    it('should NOT show owner-only nav items for admin role', async () => {
      renderNavbar({ storedUser: { id: 3, name: 'Admin', role: 'admin', token: 'tok' } });
      await waitFor(() => {
        expect(screen.queryByText(/Laporan/i)).toBeNull();
        expect(screen.queryByText(/Anggota/i)).toBeNull();
      });
    });

    it('should show common nav items for all roles', async () => {
      const user = userEvent.setup();
      renderNavbar({ storedUser: { id: 2, name: 'Staff', role: 'staff', token: 'tok' } });
      await waitFor(() => expect(screen.getAllByText(/Toko Besi Serta Guna/i).length).toBeGreaterThan(0));
      await user.click(screen.getAllByRole('button')[0]);
      await waitFor(() => {
        expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Input Transaksi/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Daftar Barang/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Pengaturan/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('pending approvals badge', () => {
    it('should fetch pending approvals for owner', async () => {
      getPendingApprovals.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      renderNavbar({ storedUser: { id: 1, name: 'Owner', role: 'owner', token: 'tok' } });
      await waitFor(() => expect(getPendingApprovals).toHaveBeenCalled());
    });

    it('should NOT fetch pending approvals for non-owner', async () => {
      renderNavbar({ storedUser: { id: 2, name: 'Staff', role: 'staff', token: 'tok' } });
      await waitFor(() => expect(screen.queryByText(/Laporan/i)).toBeNull());
      expect(getPendingApprovals).not.toHaveBeenCalled();
    });

    it('should show badge count when there are pending approvals', async () => {
      getPendingApprovals.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      renderNavbar({ storedUser: { id: 1, name: 'Owner', role: 'owner', token: 'tok' } });
      await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
    });

    it('should handle API error gracefully without crashing', async () => {
      getPendingApprovals.mockRejectedValue(new Error('Network error'));
      expect(() => renderNavbar({ storedUser: { id: 1, name: 'Owner', role: 'owner', token: 'tok' } })).not.toThrow();
    });
  });

  describe('theme toggle', () => {
    it('should show moon icon in light mode', async () => {
      renderNavbar({ storedUser: { id: 1, name: 'Zandi', role: 'staff', token: 'tok' }, initialTheme: 'light' });
      await waitFor(() => {
        const moonPaths = document.querySelectorAll('path[d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"]');
        expect(moonPaths.length).toBeGreaterThan(0);
      });
    });

    it('should show sun icon in dark mode', async () => {
      renderNavbar({ storedUser: { id: 1, name: 'Zandi', role: 'staff', token: 'tok' }, initialTheme: 'dark' });
      await waitFor(() => {
        const sunCircles = document.querySelectorAll('circle[cx="12"][cy="12"][r="5"]');
        expect(sunCircles.length).toBeGreaterThan(0);
      });
    });
  });

  describe('mobile sidebar', () => {
    it('should toggle sidebar open when hamburger is clicked', async () => {
      const user = userEvent.setup();
      renderNavbar({ storedUser: { id: 1, name: 'Zandi', role: 'staff', token: 'tok' } });
      await waitFor(() => expect(screen.getAllByText(/Toko Besi Serta Guna/i).length).toBeGreaterThan(0));
      await user.click(screen.getAllByRole('button')[0]);
      await waitFor(() => expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0));
    });
  });

  describe('logout', () => {
    it('should call onLogout when logout button is clicked', async () => {
      const user = userEvent.setup();
      const onLogout = vi.fn();
      renderNavbar({ storedUser: { id: 1, name: 'Zandi', role: 'staff', token: 'tok' }, onLogout });
      await waitFor(() => expect(screen.getAllByText(/Toko Besi Serta Guna/i).length).toBeGreaterThan(0));
      await user.click(screen.getAllByRole('button')[0]);
      await waitFor(() => expect(screen.getByText(/Logout/i)).toBeTruthy());
      await user.click(screen.getByText(/Logout/i));
      expect(onLogout).toHaveBeenCalledOnce();
    });
  });
});
