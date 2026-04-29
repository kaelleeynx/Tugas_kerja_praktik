import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('animejs', () => ({ animate: vi.fn(), stagger: vi.fn(() => 0) }));
vi.mock('framer-motion', () => ({ motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />, XAxis: () => <div />, YAxis: () => <div />,
  CartesianGrid: () => <div />, Tooltip: () => <div />, Legend: () => <div />,
  ResponsiveContainer: ({ children }) => <div>{children}</div>, Cell: () => <div />,
}));
vi.mock('../../services/api', () => ({
  getTransactions: vi.fn(),
  deleteTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));

import Dashboard from '../../components/Dashboard';
import { getTransactions } from '../../services/api';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';

const today = new Date().toISOString().split('T')[0];
const mockTransactions = [
  { id: 1, type: 'penjualan', date: today, quantity: 2, total: 50000, price_list: { product_name: 'Besi Hollow' } },
  { id: 2, type: 'pengeluaran', date: today, quantity: 1, total: 20000, price_list: { product_name: 'Cat Besi' } },
  { id: 3, type: 'penjualan', date: today, quantity: 3, total: 75000, price_list: { product_name: 'Pipa Galvanis' } },
];

function renderDashboard(storedUser = { id: 1, name: 'Zandi', role: 'owner', token: 'tok' }) {
  if (storedUser) {
    localStorage.setItem('activeUser', JSON.stringify(storedUser));
    localStorage.setItem('theme', 'light');
  }
  return render(
    <MemoryRouter>
      <AuthProvider><ThemeProvider><Dashboard /></ThemeProvider></AuthProvider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, media: query, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('loading state', () => {
    it('should show loading spinner while fetching', () => {
      getTransactions.mockImplementation(() => new Promise(() => {}));
      renderDashboard();
      expect(screen.getByText(/Loading dashboard/i)).toBeTruthy();
    });
  });

  describe('after data loads', () => {
    it('should show Dashboard heading', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText('Dashboard')).toBeTruthy());
    });

    it('should greet the logged-in user by name', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText(/Zandi/)).toBeTruthy());
    });

    it('should show user role badge', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText(/owner/i)).toBeTruthy());
    });

    it('should render the bar chart', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeTruthy());
    });
  });

  describe('financial summary', () => {
    it('should show Total Penjualan card', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText(/Total Penjualan/i)).toBeTruthy());
    });

    it('should show Total Pengeluaran card', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText(/Total Pengeluaran/i)).toBeTruthy());
    });

    it('should show Laba Bersih card', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getAllByText(/Laba Bersih/i).length).toBeGreaterThan(0));
    });
  });

  describe('period filter buttons', () => {
    it('should render Harian, Bulanan, Tahunan buttons', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => {
        expect(screen.getByText('Harian')).toBeTruthy();
        expect(screen.getByText('Bulanan')).toBeTruthy();
        expect(screen.getByText('Tahunan')).toBeTruthy();
      });
    });

    it('should switch to Bulanan when clicked', async () => {
      const user = userEvent.setup();
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText('Bulanan')).toBeTruthy());
      await user.click(screen.getByText('Bulanan'));
      await waitFor(() => expect(screen.getByText(/Total Penjualan \(bulanan\)/i)).toBeTruthy());
    });

    it('should switch to Tahunan when clicked', async () => {
      const user = userEvent.setup();
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => expect(screen.getByText('Tahunan')).toBeTruthy());
      await user.click(screen.getByText('Tahunan'));
      await waitFor(() => expect(screen.getByText(/Total Penjualan \(tahunan\)/i)).toBeTruthy());
    });
  });

  describe('transaction table', () => {
    it('should show recent transactions', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard();
      await waitFor(() => {
        expect(screen.getByText('Besi Hollow')).toBeTruthy();
        expect(screen.getByText('Cat Besi')).toBeTruthy();
      });
    });

    it('should show empty state when no transactions', async () => {
      getTransactions.mockResolvedValue([]);
      renderDashboard();
      await waitFor(() => expect(screen.getByText(/Tidak ada transaksi/i)).toBeTruthy());
    });

    it('should show delete button for owner role', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard({ id: 1, name: 'Zandi', role: 'owner', token: 'tok' });
      await waitFor(() => expect(screen.getAllByTitle(/Hapus Transaksi/i).length).toBeGreaterThan(0));
    });

    it('should NOT show delete button for staff role', async () => {
      getTransactions.mockResolvedValue(mockTransactions);
      renderDashboard({ id: 2, name: 'Staff', role: 'staff', token: 'tok' });
      await waitFor(() => expect(screen.queryByTitle(/Hapus Transaksi/i)).toBeNull());
    });
  });

  describe('error handling', () => {
    it('should not crash when API fails', async () => {
      getTransactions.mockRejectedValue(new Error('Network error'));
      expect(() => renderDashboard()).not.toThrow();
      await waitFor(() => expect(screen.getByText(/Tidak ada transaksi/i)).toBeTruthy());
    });
  });
});
