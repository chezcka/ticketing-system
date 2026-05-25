import axios from 'axios';
import { getToken, removeToken } from '../utils/localStorage';
 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
 
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
 
// Request interceptor - add token to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
// ✅ Response interceptor - FIXED: No automatic redirects
// Let components handle 401 errors so error messages can display properly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
    });
    
    // ❌ REMOVED: window.location.href = '/login'
    // This was causing automatic refresh and preventing error messages
    
    // ✅ Just reject the error - let components and AuthProvider handle it
    return Promise.reject(error);
  }
);
 
export default api;