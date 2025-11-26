import axios from 'axios';

// API URL - backend без префикса /api
const API_URL = import.meta.env.VITE_API_URL || 'https://kupiyproday.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 секунд для пробуждения Render сервера
});

// Interceptor для добавления Telegram auth data (с проверкой hash на backend)
api.interceptors.request.use((config) => {
  // ✅ Отправляем initData с hash для криптографической проверки
  if (window.Telegram?.WebApp?.initData) {
    config.headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
  }
  // Fallback для dev/testing (незащищённый)
  else if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
    config.headers['X-Telegram-User'] = JSON.stringify(
      window.Telegram.WebApp.initDataUnsafe.user
    );
  }
  console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Interceptor для логирования ответов и ошибок
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, `(${response.data?.length || 'OK'})`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.config?.url, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
  // MongoDB backend endpoints (без /api префикса)
  getAll: () => api.get('/users'),
  register: (data: any) => api.post('/users/register', data),
  getProfile: (userId: string) => api.get(`/users/${userId}`),
  getById: (userId: string) => api.get(`/users/${userId}`),
  updateProfile: (userId: string, data: any) => api.put(`/users/${userId}`, data),
  deleteProfile: (userId: string) => api.delete(`/users/${userId}`),
  checkNickname: (nickname: string) => 
    api.get(`/users/check-nickname/${nickname}`),
};

export const listingsAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  getAllForAdmin: () => api.get('/listings/admin/all'),
  getById: (id: string) => api.get(`/listings/${id}`),
  getByUser: (userId: string) => api.get(`/listings/user/${userId}`),
  create: (data: any) => api.post('/listings', data),
  update: (id: string, data: any) => api.put(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/listings/${id}`, { status }),
  getCountries: () => api.get('/listings/locations/countries'),
  getCities: (country: string) => api.get('/listings/locations/cities', { params: { country } }),
};

export const chatsAPI = {
  getByUser: (userId: string) => api.get(`/chats/user/${userId}`),
  getById: (chatId: string) => api.get(`/chats/${chatId}`),
  getByListingAndUser: (listingId: string, userId: string) => 
    api.get(`/chats/listing/${listingId}/user/${userId}`),
  // НОВЫЙ МЕТОД: Найти или создать чат между двумя пользователями
  findOrCreate: (data: {
    buyerId: string;
    sellerId: string;
    listingId: string;
    buyerNickname: string;
    sellerNickname: string;
  }) => api.post('/chats/find-or-create', data),
  // УСТАРЕВШИЙ метод (оставлен для совместимости)
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

export const notificationsAPI = {
  getAll: (userId: string, params?: any) => 
    api.get(`/notifications/${userId}`, { params }),
  markAsRead: (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId: string) =>
    api.patch(`/notifications/user/${userId}/read-all`),
  create: (data: any) => api.post('/notifications', data),
  delete: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
  clearRead: (userId: string) =>
    api.delete(`/notifications/user/${userId}/clear-read`),
};

export default api;
