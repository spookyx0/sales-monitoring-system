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

  // --- Dashboard ---
  getOverview: async () => {
    // This route doesn't exist on the backend, so we'll mock it for now.
    // In a real app, you'd create a `GET /api/dashboard/overview` endpoint.
    return {
      monthRevenue: 25430.50,
      totalItems: 342,
      lowStockCount: 18,
      monthExpenses: 8200.00,
      months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      revenue: [18500, 22300, 19800, 24100, 23200, 25430],
      topItems: [
        { name: 'Product A', qty: 145 }, { name: 'Product B', qty: 98 },
        { name: 'Product C', qty: 87 }, { name: 'Product D', qty: 76 },
        { name: 'Product E', qty: 65 }
      ]
    };
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
    // Delete might not return a body, check for 200/204 status
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
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
};

export default api;