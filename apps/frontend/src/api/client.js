import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('token', data.token);
        processQueue(null, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const deploymentsAPI = {
  getByProject: (projectId) => api.get(`/deployments/${projectId}`),
  create: (projectId) => api.post(`/deployments/${projectId}`),
};

export const aiAPI = {
  generateDockerfile: (data) => api.post('/ai/generate-dockerfile', data),
  generateWorkflow: (data) => api.post('/ai/generate-workflow', data),
  analyzeLogs: (data) => api.post('/ai/analyze-logs', data),
};

export const monitoringAPI = {
  getMetrics: () => api.get('/monitoring/metrics'),
  getHistory: () => api.get('/monitoring/history'),
  getStats: () => api.get('/monitoring/stats'),
  getInsights: () => api.get('/monitoring/insights'),
  getLogs: (count = 3) => api.get(`/monitoring/logs?count=${count}`),
};
