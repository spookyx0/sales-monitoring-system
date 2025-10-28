const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

let token = localStorage.getItem('token');

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (response) => {
  const json = await response.json();
  if (!response.ok) {
    // The backend error format is { error: { message: '...' } }
    const message = json.error?.message || json.message || 'Something went wrong';
    throw new Error(message);
  }
  return json.data;
};

const api = {
  // --- Auth ---
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    token = data.token;
    localStorage.setItem('token', token);
    return data;
  },
  logout: () => {
    token = null;
    localStorage.removeItem('token');
  },
  getMe: async () => {
    if (!token) return null;
    const response = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // --- Analytics ---
  getRevenueTrend: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/analytics/revenue-trend?${query}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  getExpenseStats: async () => {
    const response = await fetch(`${API_URL}/analytics/expense-stats`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // --- Items ---
  getItems: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/items?${query}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createItem: async (itemData) => {
    const response = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });
    return handleResponse(response);
  },
  updateItem: async (id, itemData) => {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });
    if (response.status === 200 || response.status === 204) {
      // Successful update might not return a body, or might return the updated object
      if (response.headers.get("content-length") === "0") return { success: true };
    }
    return handleResponse(response); // Use standard handling for errors or if body exists
  },
  deleteItem: async (id) => {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      // If there's an error, the backend should send a JSON error message.
      return handleResponse(response);
    }
    return { success: true }; // For 200 OK or 204 No Content
  },
  restoreItem: async (id) => {
    const response = await fetch(`${API_URL}/items/${id}/restore`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      return handleResponse(response);
    }
    return { success: true };
  },

  // --- Sales ---
  getSales: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/sales?${query}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  createSale: async (saleData) => {
    const response = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saleData),
    });
    return handleResponse(response);
  },
  // --- Audits ---
  getAudits: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/audits?${query}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // --- Expenses ---
  getExpenses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/expenses?${query}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createExpense: async (expenseData) => {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(expenseData),
    });
    return handleResponse(response);
  },
  updateExpense: async (id, expenseData) => {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(expenseData),
    });
    return handleResponse(response);
  },
  deleteExpense: async (id) => {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    // A 204 response means success but has no content to parse.
    // We check for !response.ok AND status is not 204.
    if (!response.ok && response.status !== 204) {
      return handleResponse(response);
    }
    return { success: true };
  },
};

export default api;