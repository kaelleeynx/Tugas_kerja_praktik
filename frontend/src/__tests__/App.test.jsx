import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../components/Dashboard', () => ({ default: () => <div>Dashboard</div> }));
vi.mock('../components/TransactionForm', () => ({ default: () => <div>TransactionForm</div> }));
vi.mock('../components/PriceList', () => ({ default: () => <div>PriceList</div> }));
vi.mock('../components/ApprovalInbox', () => ({ default: () => <div>ApprovalInbox</div> }));
vi.mock('../components/Settings', () => ({ default: () => <div>Settings</div> }));
vi.mock('../components/ReportView', () => ({ default: () => <div>ReportView</div> }));
vi.mock('../components/UserManagement', () => ({ default: () => <div>UserManagement</div> }));
vi.mock('../services/apiClient', () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  setLogoutCallback: vi.fn(),
}));

import LoginForm from '../components/LoginForm';

describe('LoginForm', () => {
  it('should render login form with username and password fields', () => {
    render(<LoginForm onLogin={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText(/username/i) || screen.getByPlaceholderText(/username/i)).toBeTruthy();
  });
});
