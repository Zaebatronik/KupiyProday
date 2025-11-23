import axios from 'axios';

// Локальный сервер JSON Server на твоем компьютере
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Interceptor для добавления Telegram user data
api.interceptors.request.use((config) => {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    config.headers['X-Telegram-User'] = JSON.stringify(
      window.Telegram.WebApp.initDataUnsafe.user
    );
  }
  return config;
});

export const userAPI = {
  // JSON Server endpoints
  getAll: () => api.get('/users'),
  register: (data: any) => api.post('/users', data),
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (userId: string, data: any) => api.put(`/users/${userId}`, data),
  checkNickname: (nickname: string) => 
    api.get('/users').then(res => ({
      data: { available: !res.data.some((u: any) => u.nickname === nickname) }
    })),
};

export const listingsAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  getById: (id: string) => api.get(`/listings/${id}`),
  getByUser: (userId: string) => 
    api.get('/listings').then(res => ({
      data: res.data.filter((l: any) => l.userId === userId)
    })),
  create: (data: any) => api.post('/listings', data),
  update: (id: string, data: any) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/listings/${id}`, { status }),
};

export const chatsAPI = {
  getByUser: (userId: string) => api.get(`/chats/user/${userId}`),
  getById: (chatId: string) => api.get(`/chats/${chatId}`),
  create: (data: any) => api.post('/chats', data),
  sendMessage: (chatId: string, message: any) =>
    api.post(`/chats/${chatId}/messages`, message),
  shareContacts: (chatId: string, userId: string) =>
    api.post(`/chats/${chatId}/share-contacts`, { userId }),
};

export const reportsAPI = {
  create: (data: any) => api.post('/reports', data),
  getAll: () => api.get('/reports'),
  updateStatus: (id: string, status: string) =>
    api.patch(`/reports/${id}/status`, { status }),
};

export default api;
