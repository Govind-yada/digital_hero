import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: extract error message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  getMe: () => api.get('/auth/me').then((r) => r.data),
};

export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans').then((r) => r.data),
  getCurrent: () => api.get('/subscriptions/current').then((r) => r.data),
  createCheckoutSession: (planType) =>
    api.post('/subscriptions/create-checkout-session', { planType }).then((r) => r.data),
  cancel: () => api.post('/subscriptions/cancel').then((r) => r.data),
  simulateToggle: (data) => api.post('/subscriptions/simulate-toggle', data).then((r) => r.data),
};

export const charityApi = {
  list: (params) => api.get('/charities', { params }).then((r) => r.data),
  getFeatured: () => api.get('/charities/featured').then((r) => r.data),
  getById: (id) => api.get(`/charities/${id}`).then((r) => r.data),
  updateUserCharity: (data) => api.put('/charities/user/select', data).then((r) => r.data),
  donate: (id, data) => api.post(`/charities/${id}/donate`, data).then((r) => r.data),
  adminCreate: (data) => api.post('/charities', data).then((r) => r.data),
  adminUpdate: (id, data) => api.put(`/charities/${id}`, data).then((r) => r.data),
  adminDelete: (id) => api.delete(`/charities/${id}`).then((r) => r.data),
};

export const scoreApi = {
  getScores: () => api.get('/scores').then((r) => r.data),
  addScore: (data) => api.post('/scores', data).then((r) => r.data),
  updateScore: (id, data) => api.put(`/scores/${id}`, data).then((r) => r.data),
  deleteScore: (id) => api.delete(`/scores/${id}`).then((r) => r.data),
};

export const drawApi = {
  getUpcoming: () => api.get('/draws/upcoming').then((r) => r.data),
  getHistory: () => api.get('/draws/history').then((r) => r.data),
  getById: (id) => api.get(`/draws/${id}`).then((r) => r.data),
  getUserEntries: () => api.get('/draws/user/entries').then((r) => r.data),
  adminList: () => api.get('/draws/admin/all').then((r) => r.data),
  adminCreate: (data) => api.post('/draws/admin/create', data).then((r) => r.data),
  adminGenerateNumbers: (id, data) =>
    api.post(`/draws/admin/${id}/generate-numbers`, data).then((r) => r.data),
  adminSimulate: (id) => api.post(`/draws/admin/${id}/simulate`).then((r) => r.data),
  adminPublish: (id) => api.post(`/draws/admin/${id}/publish`).then((r) => r.data),
};

export const winnerApi = {
  getMyWinnings: () => api.get('/winners/my-winnings').then((r) => r.data),
  uploadProof: (id, formData) =>
    api
      .post(`/winners/${id}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  adminList: (params) => api.get('/winners/admin/all', { params }).then((r) => r.data),
  adminReviewProof: (id, data) => api.post(`/winners/admin/${id}/review`, data).then((r) => r.data),
  adminMarkPayout: (id, data) => api.post(`/winners/admin/${id}/payout`, data).then((r) => r.data),
};

export const adminApi = {
  getOverview: () => api.get('/admin/overview').then((r) => r.data),
  listUsers: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data).then((r) => r.data),
  getUserScores: (id) => api.get(`/admin/users/${id}/scores`).then((r) => r.data),
};

export default api;
