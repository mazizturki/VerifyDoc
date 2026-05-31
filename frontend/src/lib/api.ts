import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('verifydoc_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('verifydoc_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  profile: () => api.get('/auth/profile').then((r) => r.data),
};

// Reports
export const reportsApi = {
  list: (page = 1, limit = 20) =>
    api.get(`/reports?page=${page}&limit=${limit}`).then((r) => r.data),
  getPublic: (id: string) =>
    api.get(`/reports/public/${id}`).then((r) => r.data),
  create: (form: FormData) =>
    api.post('/reports', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id: string, data: object) =>
    api.put(`/reports/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/reports/${id}`).then((r) => r.data),
  addVersion: (id: string, form: FormData) =>
    api.post(`/reports/${id}/versions`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  qrUrl: (id: string, fmt: 'png' | 'svg') =>
    `${API_URL}/reports/${id}/qrcode?format=${fmt}`,
  verifyHash: (id: string, form: FormData) =>
    api.post(`/reports/public/${id}/verify`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  downloadUrl: (versionId: string) =>
    `${API_URL}/reports/public/version/${versionId}/download`,
};
