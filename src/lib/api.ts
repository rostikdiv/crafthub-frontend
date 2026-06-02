import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token'); // Updated key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Optional: Redirect logic
    }
    return Promise.reject(error);
  }
);

export interface DecodedToken {
  sub: string; // subject (usually email or userId depending on backend impl)
  exp: number;
  iat: number;
  // Common custom claims patterns, we will adjust based on actual token content
  id?: string; // Backend uses 'id'
  userId?: string;
  role?: string;
}

export const getUserIdFromToken = (): string | null => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token'); // Check both keys just in case
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Strategy: Try 'id' claim (backend standard), then 'userId', then 'sub'
    return decoded.id || decoded.userId || decoded.sub;
  } catch (error) {
    return null;
  }
};

import { City, Branch } from './types';

export const deliveryApi = {
  getLocations: (page = 0, size = 20) =>
    api.get<any>('/delivery/locations', { params: { page, size } }),

  getDeliveryRegions: (provider: string) =>
    api.get<string[]>('/delivery/locations/regions', { params: { provider } }),

  searchDeliveryCities: (provider: string, query: string, region?: string) =>
    api.get<City[]>('/delivery/locations/cities', { params: { provider, query, region } }),

  getDeliveryBranches: (cityId: string) =>
    api.get<Branch[]>('/delivery/locations/branches', { params: { cityId } }),

  importLocations: (data: any[]) =>
    api.post('/delivery/locations/import', data),

  updateLocation: (id: string, data: any) =>
    api.put(`/delivery/locations/${id}`, data),

  deleteLocation: (id: string) =>
    api.delete(`/delivery/locations/${id}`),

  getAllBranches: (provider: string, page = 0, size = 20) =>
    api.get<any>('/delivery/locations/branches/all', { params: { provider, page, size } }),

  updateBranch: (id: string, data: any) =>
    api.put(`/delivery/locations/branches/${id}`, data),

  deleteBranch: (id: string) =>
    api.delete(`/delivery/locations/branches/${id}`),
};

export const sellerApi = {
  getOrders: (page = 0, size = 10, status?: string) =>
    api.get('/orders/seller', { params: { page, size, status, sort: 'createdAt,desc' } }),

  updateOrderStatus: (orderId: string, status: string) =>
    api.patch(`/orders/${orderId}/status`, null, { params: { status } }),
};

export const sellerPointApi = {
  getPoints: () => api.get('/sellers/points'),
  createPoint: (data: any) => api.post('/sellers/points', data),
  updatePoint: (id: string, data: any) => api.put(`/sellers/points/${id}`, data),
  deletePoint: (id: string) => api.delete(`/sellers/points/${id}`),
};

export const orderActionsApi = {
  cancelOrder: (orderId: string, reason?: string) =>
    api.post(`/orders/${orderId}/cancel`, reason || '', {
      headers: { 'Content-Type': 'text/plain' }
    }),
  requestReturn: (orderId: string, reason: string) =>
    api.post(`/orders/${orderId}/return`, { reason }),

  processReturn: (orderId: string, approved: boolean) =>
    api.put(`/orders/${orderId}/return/process`, null, { params: { approved } }),

  completeReturn: (orderId: string) =>
    api.put(`/orders/${orderId}/return/complete`),
};
