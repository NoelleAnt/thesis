import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('asap-agap-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password) => api.post('/auth/register', { username, password }),
  me: () => api.get('/auth/me'),
};

export const centersApi = {
  list: (search) => api.get('/centers', { params: { search } }),
  get: (id) => api.get(`/centers/${id}`),
  create: (payload) => api.post('/centers', payload),
  update: (id, payload) => api.put(`/centers/${id}`, payload),
  updateEvacuees: (id, payload) => api.patch(`/centers/${id}/evacuees`, payload),
  updateResources: (id, resources) => api.patch(`/centers/${id}/resources`, { resources }),
};

export const requestsApi = {
  list: (status = 'all') => api.get('/requests', { params: { status } }),
  create: (payload) => api.post('/requests', payload),
  updateStatus: (id, payload) => api.patch(`/requests/${id}/status`, payload),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const logsApi = {
  list: (action = 'all') => api.get('/logs', { params: { action } }),
};

export const adminApi = {
  resetDemo: () => api.post('/admin/reset-demo'),
};
