import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock apiClient before importing api.js
vi.mock('../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../services/apiClient';
import {
  login,
  register,
  logout,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getPendingApprovals,
  approveUser,
  rejectUser,
  getPriceList,
  sellPriceItem,
  restockPriceItem,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../services/api';

describe('api.js — Auth', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('login()', () => {
    it('should call POST /auth/login with username and password', async () => {
      const mockResponse = { data: { data: { token: 'abc123', user: { id: 1 } } } };
      apiClient.post.mockResolvedValue(mockResponse);
      const result = await login('owner', 'owner123');
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { username: 'owner', password: 'owner123' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw when credentials are invalid', async () => {
      apiClient.post.mockRejectedValue({ response: { status: 401 } });
      await expect(login('wrong', 'creds')).rejects.toMatchObject({ response: { status: 401 } });
    });
  });

  describe('register()', () => {
    it('should call POST /auth/register with user data', async () => {
      const userData = { username: 'staff1', password: 'pass', name: 'Staff', role: 'staff' };
      const mockResponse = { data: { data: { id: 2, is_approved: true } } };
      apiClient.post.mockResolvedValue(mockResponse);
      const result = await register(userData);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout()', () => {
    it('should call POST /auth/logout', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await logout();
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });
});

describe('api.js — Transactions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('getTransactions()', () => {
    it('should return array when response is already an array', async () => {
      const transactions = [{ id: 1 }, { id: 2 }];
      apiClient.get.mockResolvedValue({ data: transactions });
      const result = await getTransactions();
      // FIX: getTransactions now accepts params object, passes as { params }
      expect(apiClient.get).toHaveBeenCalledWith('/transactions', { params: {} });
      expect(result).toEqual(transactions);
    });

    it('should unwrap data.data when response is wrapped', async () => {
      const transactions = [{ id: 1 }];
      apiClient.get.mockResolvedValue({ data: { data: transactions } });
      expect(await getTransactions()).toEqual(transactions);
    });

    it('should return empty array when data is missing', async () => {
      apiClient.get.mockResolvedValue({ data: {} });
      expect(await getTransactions()).toEqual([]);
    });
  });

  describe('createTransaction()', () => {
    it('should call POST /transactions with transaction data', async () => {
      const txData = { type: 'penjualan', product: 'Besi', quantity: 5, price: 10000 };
      const mockResponse = { data: { data: { id: 10, ...txData } } };
      apiClient.post.mockResolvedValue(mockResponse);
      const result = await createTransaction(txData);
      expect(apiClient.post).toHaveBeenCalledWith('/transactions', txData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateTransaction()', () => {
    it('should call PUT /transactions/:id with update data', async () => {
      apiClient.put.mockResolvedValue({ data: { data: { id: 5, quantity: 10 } } });
      await updateTransaction(5, { quantity: 10 });
      expect(apiClient.put).toHaveBeenCalledWith('/transactions/5', { quantity: 10 });
    });
  });

  describe('deleteTransaction()', () => {
    it('should call DELETE /transactions/:id', async () => {
      apiClient.delete.mockResolvedValue({ data: { success: true } });
      await deleteTransaction(3);
      expect(apiClient.delete).toHaveBeenCalledWith('/transactions/3');
    });
  });
});

describe('api.js — Approvals', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('getPendingApprovals()', () => {
    it('should call GET /approvals and return array', async () => {
      const pending = [{ id: 1, username: 'admin1' }];
      apiClient.get.mockResolvedValue({ data: pending });
      expect(await getPendingApprovals()).toEqual(pending);
    });
  });

  describe('approveUser()', () => {
    it('should call POST /approvals/:userId/approve', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await approveUser(7);
      expect(apiClient.post).toHaveBeenCalledWith('/approvals/7/approve');
    });
  });

  describe('rejectUser()', () => {
    it('should call POST /approvals/:userId/reject', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await rejectUser(7);
      expect(apiClient.post).toHaveBeenCalledWith('/approvals/7/reject');
    });
  });
});

describe('api.js — Price List', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('getPriceList()', () => {
    it('should call GET /price-list and return array', async () => {
      const items = [{ id: 1, product_name: 'Besi Hollow', stock: 50 }];
      apiClient.get.mockResolvedValue({ data: items });
      expect(await getPriceList()).toEqual(items);
    });
  });

  describe('sellPriceItem()', () => {
    it('should call POST /price-list/:id/sale with quantity', async () => {
      apiClient.post.mockResolvedValue({ data: { stock: 48 } });
      await sellPriceItem(1, 2);
      expect(apiClient.post).toHaveBeenCalledWith('/price-list/1/sale', { quantity: 2 });
    });
  });

  describe('restockPriceItem()', () => {
    it('should call POST /price-list/:id/restock with quantity', async () => {
      apiClient.post.mockResolvedValue({ data: { stock: 55 } });
      await restockPriceItem(1, 5);
      expect(apiClient.post).toHaveBeenCalledWith('/price-list/1/restock', { quantity: 5 });
    });
  });
});

describe('api.js — Notifications', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('getNotifications()', () => {
    it('should call GET /notifications', async () => {
      apiClient.get.mockResolvedValue({ data: [] });
      await getNotifications();
      expect(apiClient.get).toHaveBeenCalledWith('/notifications');
    });
  });

  describe('getUnreadNotificationCount()', () => {
    it('should call GET /notifications/unread-count', async () => {
      apiClient.get.mockResolvedValue({ data: { count: 3 } });
      const result = await getUnreadNotificationCount();
      expect(apiClient.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('markNotificationRead()', () => {
    it('should call POST /notifications/:id/read', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await markNotificationRead(5);
      expect(apiClient.post).toHaveBeenCalledWith('/notifications/5/read');
    });
  });

  describe('markAllNotificationsRead()', () => {
    it('should call POST /notifications/mark-all-read', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await markAllNotificationsRead();
      expect(apiClient.post).toHaveBeenCalledWith('/notifications/mark-all-read');
    });
  });

  describe('deleteNotification()', () => {
    it('should call DELETE /notifications/:id', async () => {
      apiClient.delete.mockResolvedValue({ data: { success: true } });
      await deleteNotification(9);
      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/9');
    });
  });
});
