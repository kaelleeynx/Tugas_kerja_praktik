import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
    </div>
  );
}

function renderWithTheme(initialTheme = null) {
  if (initialTheme) localStorage.setItem('theme', initialTheme);
  return render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  // ─── Initial State ────────────────────────────────────────────────────

  describe('initial theme', () => {
    it('should default to light when no saved preference and system is light', () => {
      renderWithTheme();
      expect(screen.getByTestId('theme-value').textContent).toBe('light');
    });

    it('should default to dark when system prefers dark and no saved preference', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      renderWithTheme();
      expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    });

    it('should restore saved light theme from localStorage', () => {
      renderWithTheme('light');
      expect(screen.getByTestId('theme-value').textContent).toBe('light');
    });

    it('should restore saved dark theme from localStorage', () => {
      renderWithTheme('dark');
      expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    });
  });

  // ─── Toggle Behavior ─────────────────────────────────────────────────

  describe('toggleTheme()', () => {
    it('should switch from light to dark', async () => {
      const user = userEvent.setup();
      renderWithTheme('light');
      await user.click(screen.getByTestId('toggle-btn'));
      expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    });

    it('should switch from dark to light', async () => {
      const user = userEvent.setup();
      renderWithTheme('dark');
      await user.click(screen.getByTestId('toggle-btn'));
      expect(screen.getByTestId('theme-value').textContent).toBe('light');
    });

    it('should toggle back and forth correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme('light');
      await user.click(screen.getByTestId('toggle-btn'));
      expect(screen.getByTestId('theme-value').textContent).toBe('dark');
      await user.click(screen.getByTestId('toggle-btn'));
      expect(screen.getByTestId('theme-value').textContent).toBe('light');
    });
  });

  // ─── DOM Side Effects ─────────────────────────────────────────────────

  describe('DOM class updates', () => {
    it('should add light class to documentElement on light theme', () => {
      renderWithTheme('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should add dark class to documentElement on dark theme', () => {
      renderWithTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should set data-theme attribute on documentElement', () => {
      renderWithTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should update localStorage when theme changes', async () => {
      const user = userEvent.setup();
      renderWithTheme('light');
      await user.click(screen.getByTestId('toggle-btn'));
      expect(localStorage.getItem('theme')).toBe('dark');
    });
  });

  // ─── Error Handling ───────────────────────────────────────────────────

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within ThemeProvider');
      consoleSpy.mockRestore();
    });
  });
});
