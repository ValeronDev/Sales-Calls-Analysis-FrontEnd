import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
};

export const callsAPI = {
  getCalls: (params = {}) => api.get('/calls', { params }),
  getCallDetail: (callId) => api.get(`/calls/${callId}`),
  receiveAnalysis: (data) => api.post('/webhook/call-analysis', data),
};

export const dashboardAPI = {
  getManagerAnalytics: () => api.get('/dashboard/manager/analytics'),
  getReps: () => api.get('/reps'),
};

export const chatAPI = {
  sendMessage: (message, callId = null) => api.post('/chat', { message, call_id: callId }),
  getChatHistory: (callId = null) => api.get('/chat/history', { params: { call_id: callId } }),
};

export default api;