import api from './api';
 
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};
 
export const register = async (email, password, fullName) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    fullName,
  });
  return response.data.data;
};
 
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};
 
export const logout = async () => {
  return api.post('/auth/logout');
};