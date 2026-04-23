/**
 * API Service — Centralized API functions using Axios client
 * 
 * All functions use apiClient which automatically:
 * - Attaches Bearer token from localStorage
 * - Handles 401 → auto-logout
 * - Sets Accept/Content-Type headers
 */
import apiClient from './apiClient';

// ─── Auth ────────────────────────────────────────────────────────────────

export const login = async (username, password) => {
  const { data } = await apiClient.post('/auth/login', { username, password });
  return data;
};

export const register = async (userData) => {
  const { data } = await apiClient.post('/auth/register', userData);
  return data;
};

export const logout = async () => {
  const { data } = await apiClient.post('/auth/logout');
  return data;
};

// ─── Users ───────────────────────────────────────────────────────────────

export const getUsers = async () => {
  const { data } = await apiClient.get('/users');
  return Array.isArray(data) ? data : (data.data || []);
};

export const updateUser = async (userId, userData) => {
  const isFormData = userData instanceof FormData;

  if (isFormData) {
    // Laravel requires POST with _method: PUT for multipart/form-data
    userData.append('_method', 'PUT');
    const { data } = await apiClient.post(`/users/${userId}`, userData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  const { data } = await apiClient.put(`/users/${userId}`, userData);
  return data;
};

export const deleteUser = async (userId) => {
  const { data } = await apiClient.delete(`/users/${userId}`);
  return data;
};

// ─── Transactions ────────────────────────────────────────────────────────

export const getTransactions = async () => {
  const { data } = await apiClient.get('/transactions');
  return Array.isArray(data) ? data : (data.data || []);
};

export const createTransaction = async (transactionData) => {
  const { data } = await apiClient.post('/transactions', transactionData);
  return data;
};

export const updateTransaction = async (id, updateData) => {
  const { data } = await apiClient.put(`/transactions/${id}`, updateData);
  return data;
};

export const deleteTransaction = async (id) => {
  const { data } = await apiClient.delete(`/transactions/${id}`);
  return data;
};

// ─── Approvals ───────────────────────────────────────────────────────────

export const getPendingApprovals = async () => {
  const { data } = await apiClient.get('/approvals');
  return Array.isArray(data) ? data : (data.data || []);
};

export const approveUser = async (userId) => {
  const { data } = await apiClient.post(`/approvals/${userId}/approve`);
  return data;
};

export const rejectUser = async (userId) => {
  // Backend route is POST, NOT DELETE
  const { data } = await apiClient.post(`/approvals/${userId}/reject`);
  return data;
};

// ─── Price List ──────────────────────────────────────────────────────────

export const getPriceList = async () => {
  const { data } = await apiClient.get('/price-list');
  return Array.isArray(data) ? data : (data.data || []);
};

export const updatePriceItem = async (id, itemData) => {
  const { data } = await apiClient.put(`/price-list/${id}`, itemData);
  return data;
};

export const sellPriceItem = async (id, quantity) => {
  const { data } = await apiClient.post(`/price-list/${id}/sale`, { quantity });
  return data;
};

export const restockPriceItem = async (id, quantity) => {
  const { data } = await apiClient.post(`/price-list/${id}/restock`, { quantity });
  return data;
};

// ─── Notifications ───────────────────────────────────────────────────────

export const getNotifications = async () => {
  const { data } = await apiClient.get('/notifications');
  return data;
};

export const getUnreadNotificationCount = async () => {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data;
};

export const markNotificationRead = async (id) => {
  const { data } = await apiClient.post(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await apiClient.post('/notifications/mark-all-read');
  return data;
};

export const deleteNotification = async (id) => {
  const { data } = await apiClient.delete(`/notifications/${id}`);
  return data;
};