// ============================================================
// OneFlesh — Axios API Client with Interceptors
// ============================================================

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore.js';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000';

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true, // for refresh token cookie
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach access token ─────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — silent token refresh ───────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = data.data.accessToken as string;
        useAuthStore.getState().setAccessToken(newToken);

        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Typed API modules ─────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: unknown) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  mfaVerify: (data: { tempToken: string; code: string }) => api.post('/auth/mfa/verify', data),
  mfaSetup: () => api.post('/auth/mfa/setup'),
  mfaEnable: (data: { secret: string; code: string }) => api.post('/auth/mfa/enable', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  listSessions: () => api.get('/auth/sessions'),
  revokeSession: (id: string) => api.delete(`/auth/sessions/${id}`),
};

export const profilesApi = {
  list: (params?: Record<string, unknown>) => api.get('/profiles', { params }),
  get: (id: string) => api.get(`/profiles/${id}`),
  create: (data: unknown) => api.post('/profiles', data),
  update: (id: string, data: unknown) => api.put(`/profiles/${id}`, data),
  approve: (id: string) => api.patch(`/profiles/${id}/approve`),
  pause: (id: string) => api.patch(`/profiles/${id}/pause`),
  delete: (id: string) => api.delete(`/profiles/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/profiles/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getShortlist: () => api.get('/profiles/shortlist'),
  addShortlist: (id: string) => api.post(`/profiles/shortlist/${id}`),
  removeShortlist: (id: string) => api.delete(`/profiles/shortlist/${id}`),
};

export const alliancesApi = {
  list: (params?: Record<string, unknown>) => api.get('/alliances', { params }),
  get: (id: string) => api.get(`/alliances/${id}`),
  create: (data: unknown) => api.post('/alliances', data),
  advance: (id: string, data: { note: string }) => api.patch(`/alliances/${id}/advance`, data),
  dissolve: (id: string) => api.patch(`/alliances/${id}/dissolve`),
  addNote: (id: string, content: string) => api.post(`/alliances/${id}/notes`, { content }),
  getNotes: (id: string) => api.get(`/alliances/${id}/notes`),
};

export const counsellingApi = {
  list: (params?: Record<string, unknown>) => api.get('/counselling', { params }),
  get: (id: string) => api.get(`/counselling/${id}`),
  register: (data: unknown) => api.post('/counselling', data),
  complete: (id: string, data: unknown) => api.patch(`/counselling/${id}/complete`, data),
  getCertificateUrl: (id: string) => `${BASE_URL}/api/v1/counselling/${id}/certificate`,
  getQuestions: (id: string) => api.get(`/counselling/${id}/questions`),
};

export const vendorsApi = {
  list: (params?: Record<string, unknown>) => api.get('/vendors', { params }),
  get: (id: string) => api.get(`/vendors/${id}`),
  create: (data: unknown) => api.post('/vendors', data),
  update: (id: string, data: unknown) => api.put(`/vendors/${id}`, data),
  verify: (id: string) => api.patch(`/vendors/${id}/verify`),
  feature: (id: string) => api.patch(`/vendors/${id}/feature`),
  delete: (id: string) => api.delete(`/vendors/${id}`),
  contact: (id: string) => api.post(`/vendors/${id}/contact`),
};

export const aiApi = {
  getMatches: (data: { profileId: string; topN?: number }) => api.post('/ai/match', data),
  draftLetter: (data: unknown) => api.post('/ai/letter', data),
  getCounsellingQuestions: (data: { sessionNumber: number }) =>
    api.post('/ai/counselling-questions', data),
  getAllianceSummary: (data: { allianceId: string }) => api.post('/ai/alliance-summary', data),
  chat: (data: { message: string; history?: unknown[] }) => api.post('/ai/chat', data),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const dashboardApi = {
  publicStats: () => api.get('/dashboard/public-stats'),
  pastor: () => api.get('/dashboard/pastor'),
  admin: () => api.get('/dashboard/admin'),
};

export const churchesApi = {
  list: (params?: Record<string, unknown>) => api.get('/churches', { params }),
  get: (id: string) => api.get(`/churches/${id}`),
  create: (data: unknown) => api.post('/churches', data),
  approve: (id: string) => api.patch(`/churches/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/churches/${id}/reject`, { reason }),
  update: (id: string, data: unknown) => api.patch(`/churches/${id}`, data),
  delete: (id: string) => api.delete(`/churches/${id}`),
};
