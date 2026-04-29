import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('animejs', () => ({ animate: vi.fn() }));
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../services/api', () => ({
  updateMyProfile: vi.fn(),
  changeMyPassword: vi.fn(),
}));

import Settings from '../../components/Settings';
import { updateMyProfile, changeMyPassword } from '../../services/api';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';

const mockUser = { id: 1, name: 'Zandi', username: 'rzandi', role: 'owner', token: 'tok123', profile_picture: null };

function SettingsWrapper() {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return <div data-testid="auth-loading">Loading auth...</div>;
  return <Settings />;
}

function renderSettings(user = mockUser) {
  localStorage.setItem('activeUser', JSON.stringify(user));
  localStorage.setItem('theme', 'light');
  return render(
    <MemoryRouter>
      <AuthProvider><ThemeProvider>
        <React.Suspense fallback={<div>Loading...</div>}>
          <SettingsWrapper />
        </React.Suspense>
      </ThemeProvider></AuthProvider>
    </MemoryRouter>
  );
}

describe('Settings', () => {
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

  describe('rendering', () => {
    it('should render Pengaturan heading', async () => {
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getByText('Pengaturan')).toBeTruthy();
    });

    it('should show user name and username', async () => {
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getAllByText(/Zandi/i).length).toBeGreaterThan(0);
      expect(document.body.textContent).toContain('rzandi');
    });

    it('should show owner role badge', async () => {
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getByText(/Owner/i)).toBeTruthy();
    });

    it('should show admin role badge for admin user', async () => {
      renderSettings({ ...mockUser, role: 'admin' });
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getByText(/Admin/i)).toBeTruthy();
    });

    it('should show staff role badge for staff user', async () => {
      renderSettings({ ...mockUser, role: 'staff' });
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getByText(/Staff/i)).toBeTruthy();
    });

    it('should show Nama Lengkap input pre-filled with user name', async () => {
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getByPlaceholderText(/Masukkan nama lengkap/i).value).toBe('Zandi');
    });

    it('should show username as read-only', async () => {
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.getByText('Username tidak dapat diubah')).toBeTruthy();
    });
  });

  describe('password strength indicator', () => {
    it('should show Lemah for 8-char lowercase password', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'abcdefgh');
      await waitFor(() => expect(screen.getByText('Lemah')).toBeTruthy());
    });

    it('should show Sangat Kuat for strong password', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'Str0ng!Pass');
      await waitFor(() => expect(screen.getByText('Sangat Kuat')).toBeTruthy());
    });

    it('should not show strength indicator when password is empty', async () => {
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      expect(screen.queryByText('Lemah')).toBeNull();
    });
  });

  describe('password match validation', () => {
    it('should show mismatch error when passwords differ', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'NewPass123!');
      await user.type(screen.getByPlaceholderText(/Ulangi password baru/i), 'DifferentPass');
      await waitFor(() => expect(screen.getByText(/Password tidak cocok/i)).toBeTruthy());
    });

    it('should show match confirmation when passwords are equal', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'NewPass123!');
      await user.type(screen.getByPlaceholderText(/Ulangi password baru/i), 'NewPass123!');
      await waitFor(() => expect(screen.getByText(/Password cocok/i)).toBeTruthy());
    });
  });

  describe('form submission', () => {
    it('should call updateMyProfile on submit', async () => {
      const user = userEvent.setup();
      updateMyProfile.mockResolvedValue({ data: { ...mockUser } });
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.click(screen.getByText('Simpan Perubahan'));
      await waitFor(() => expect(updateMyProfile).toHaveBeenCalled());
    });

    it('should show success message after successful update', async () => {
      const user = userEvent.setup();
      updateMyProfile.mockResolvedValue({ data: { ...mockUser } });
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.click(screen.getByText('Simpan Perubahan'));
      await waitFor(() => expect(screen.getByText(/Profil berhasil diperbarui/i)).toBeTruthy());
    });

    it('should show error when passwords mismatch on submit', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'NewPass123!');
      await user.type(screen.getByPlaceholderText(/Ulangi password baru/i), 'WrongPass');
      await user.click(screen.getByText('Simpan Perubahan'));
      await waitFor(() => expect(screen.getByText(/Password baru tidak cocok/i)).toBeTruthy());
      expect(updateMyProfile).not.toHaveBeenCalled();
    });

    it('should show error when new password entered without current password', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'NewPass123!');
      await user.type(screen.getByPlaceholderText(/Ulangi password baru/i), 'NewPass123!');
      await user.click(screen.getByText('Simpan Perubahan'));
      await waitFor(() => expect(screen.getByText(/Masukkan password lama/i)).toBeTruthy());
    });

    it('should show error message when API fails', async () => {
      const user = userEvent.setup();
      updateMyProfile.mockRejectedValue({ message: 'Server error' });
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.click(screen.getByText('Simpan Perubahan'));
      await waitFor(() => expect(screen.getByText(/Server error/i)).toBeTruthy());
    });

    it('should also call changeMyPassword when password fields are filled', async () => {
      const user = userEvent.setup();
      updateMyProfile.mockResolvedValue({ data: { ...mockUser } });
      changeMyPassword.mockResolvedValue({ success: true });
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      await user.type(screen.getByPlaceholderText(/Masukkan password saat ini/i), 'oldpass');
      await user.type(screen.getByPlaceholderText(/Kosongkan jika tidak/i), 'NewPass123!');
      await user.type(screen.getByPlaceholderText(/Ulangi password baru/i), 'NewPass123!');
      await user.click(screen.getByText('Simpan Perubahan'));
      await waitFor(() => expect(changeMyPassword).toHaveBeenCalledWith('oldpass', 'NewPass123!'));
    });
  });

  describe('cancel button', () => {
    it('should reset name to original on cancel', async () => {
      const user = userEvent.setup();
      renderSettings();
      await waitFor(() => expect(screen.queryByTestId('auth-loading')).toBeNull());
      const nameInput = screen.getByPlaceholderText(/Masukkan nama lengkap/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');
      await user.click(screen.getByText('Batal'));
      await waitFor(() => expect(nameInput.value).toBe('Zandi'));
    });
  });
});
