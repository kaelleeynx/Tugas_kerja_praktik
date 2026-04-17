const getBaseUrl = () => {
  // Support both Vite (import.meta.env) and CRA (process.env) formats
  const backendUrl = import.meta?.env?.VITE_BACKEND_URL || process.env?.REACT_APP_BACKEND_URL;
  if (backendUrl) {
    return `${backendUrl}/api`;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
     return 'http://localhost:8000/api';
  }
  // Use Railway backend for production
  return 'https://tugasmetopeen-production.up.railway.app/api';
};

const API_URL = getBaseUrl();

export const login = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error saat login');
  }
  return data;
};

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error saat registrasi');
  }
  return data;
};

export const logout = async (token) => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error saat logout');
  }
  return data;
};

export const getUsers = async (token) => {
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error mengambil data pengguna');
  }
  // Handle both direct array response and { data: [] } response format
  return Array.isArray(data) ? data : (data.data || []);
};

export const createTransaction = async (transactionData, token) => {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error membuat transaksi');
  }
  return data;
};

export const getTransactions = async (token) => {
  const response = await fetch(`${API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error mengambil data transaksi');
  }
  // Handle both direct array response and { data: [] } response format
  return Array.isArray(data) ? data : (data.data || []);
};

export const deleteTransaction = async (id, token) => {
  const response = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error menghapus transaksi');
  }
  return data;
};

export const updateUser = async (userId, userData, token) => {
  const isFormData = userData instanceof FormData;
  
  // Laravel requires POST with _method: PUT for multipart/form-data updates
  const method = isFormData ? 'POST' : 'PUT';
  
  if (isFormData) {
    userData.append('_method', 'PUT');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: method,
    headers: headers,
    body: isFormData ? userData : JSON.stringify(userData),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error memperbarui pengguna');
  }
  return data;
};

export const deleteUser = async (userId, token) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error menghapus pengguna');
  }
  return data;
};

export const getPendingApprovals = async (token) => {
  const response = await fetch(`${API_URL}/approvals`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error mengambil data persetujuan');
  }
  // Handle both direct array response and { data: [] } response format
  return Array.isArray(data) ? data : (data.data || []);
};

export const approveUser = async (userId, token) => {
  const response = await fetch(`${API_URL}/approvals/${userId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error menyetujui pengguna');
  }
  return data;
};

export const rejectUser = async (userId, token) => {
  const response = await fetch(`${API_URL}/approvals/${userId}/reject`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error menolak pengguna');
  }
  return data;
};

export const updateTransaction = async (id, data, token) => {
  const response = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || 'Error memperbarui transaksi');
  }
  return responseData;
};