import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';

function AuthConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <span data-testid="user-role">{user?.role || 'none'}</span>
      <button data-testid="login-btn" onClick={() => login({ id: 1, name: 'Zandi', role: 'owner', token: 'tok123' })}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
      <button data-testid="update-btn" onClick={() => updateUser({ id: 1, name: 'Zandi Updated', role: 'owner', token: 'tok123' })}>Update</button>
    </div>
  );
}

function renderWithAuth() {
  return render(<AuthProvider><AuthConsumer /></AuthProvider>);
}

describe('AuthContext', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  // ─── Initial State ────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should start with isLoading true then false', async () => {
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    });

    it('should start unauthenticated when no stored user', async () => {
      renderWithAuth();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user-name').textContent).toBe('none');
      });
    });

    it('should restore user from localStorage on mount', async () => {
      localStorage.setItem('activeUser', JSON.stringify({ id: 1, name: 'Zandi', role: 'owner', token: 'tok123' }));
      renderWithAuth();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user-name').textContent).toBe('Zandi');
      });
    });

    it('should not restore user if token is missing from stored data', async () => {
      localStorage.setItem('activeUser', JSON.stringify({ id: 1, name: 'Zandi', role: 'owner' }));
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('authenticated').textContent).toBe('false'));
    });

    it('should handle corrupted localStorage gracefully', async () => {
      localStorage.setItem('activeUser', 'not-valid-json{{{');
      renderWithAuth();
      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });
  });

  // ─── login() ─────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should set user and mark as authenticated', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await user.click(screen.getByTestId('login-btn'));
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user-name').textContent).toBe('Zandi');
      expect(screen.getByTestId('user-role').textContent).toBe('owner');
    });

    it('should persist user to localStorage on login', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await user.click(screen.getByTestId('login-btn'));
      const stored = JSON.parse(localStorage.getItem('activeUser'));
      expect(stored.name).toBe('Zandi');
      expect(stored.token).toBe('tok123');
    });
  });

  // ─── logout() ────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should clear user and mark as unauthenticated', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await user.click(screen.getByTestId('login-btn'));
      await user.click(screen.getByTestId('logout-btn'));
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user-name').textContent).toBe('none');
    });

    it('should remove user from localStorage on logout', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await user.click(screen.getByTestId('login-btn'));
      await user.click(screen.getByTestId('logout-btn'));
      expect(localStorage.getItem('activeUser')).toBeNull();
    });
  });

  // ─── updateUser() ─────────────────────────────────────────────────────

  describe('updateUser()', () => {
    it('should update user name while keeping authenticated', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await user.click(screen.getByTestId('login-btn'));
      await user.click(screen.getByTestId('update-btn'));
      expect(screen.getByTestId('user-name').textContent).toBe('Zandi Updated');
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    it('should persist updated user to localStorage', async () => {
      const user = userEvent.setup();
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await user.click(screen.getByTestId('login-btn'));
      await user.click(screen.getByTestId('update-btn'));
      const stored = JSON.parse(localStorage.getItem('activeUser'));
      expect(stored.name).toBe('Zandi Updated');
    });
  });

  // ─── useAuth hook ─────────────────────────────────────────────────────

  describe('useAuth hook', () => {
    it('should throw when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within AuthProvider');
      consoleSpy.mockRestore();
    });
  });
});
