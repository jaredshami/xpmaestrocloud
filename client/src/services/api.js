import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Public API instance (no auth) - for instance portal
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

// Add admin token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add instance token to instance API requests
api.interceptors.request.use((config) => {
  const instanceToken = localStorage.getItem('instanceToken');
  // Check if this is an instance endpoint and we have an instance token
  if (instanceToken && config.url?.includes('/instances/')) {
    config.headers.Authorization = `Bearer ${instanceToken}`;
  }
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token');
  },
};

export const clientService = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

export const instanceService = {
  getAll: () => api.get('/instances'),
  getByClientId: (clientId) => api.get(`/instances/client/${clientId}`),
  getById: (id) => api.get(`/instances/${id}`),
  create: (data) => api.post('/instances', data),
  delete: (id) => api.delete(`/instances/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
