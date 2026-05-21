import React, { useState } from 'react';
import AuthContext from './AuthContext';
import * as authService from '../services/authService';
import { getToken, saveToken, removeToken, getUser, saveUser, removeUser } from '../utils/localStorage';
 
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = getToken();
    const storedUser = getUser();
    return token && storedUser ? storedUser : null;
  });
 
  const [isAuth, setIsAuth] = useState(() => {
    const token = getToken();
    const storedUser = getUser();
    return !!(token && storedUser);
  });
 
  const [isLoading, setIsLoading] = useState(false);
 
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
 
      console.log('Login response from backend:', response);
 
      const token = response.token;
      const userData = response.user ?? {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        active: response.active,
      };
 
      if (!token) {
        console.error('No token in login response:', response);
        throw new Error('Login failed: no token received');
      }
 
      if (!userData || !userData.role) {
        console.error('No user/role in login response:', response);
        throw new Error('Login failed: no user data received');
      }
 
      saveToken(token);
      saveUser(userData);
      setUser(userData);
      setIsAuth(true);
 
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
 
  const register = async (email, password, fullName) => {
    try {
      const response = await authService.register(email, password, fullName);
 
      console.log('Register response from backend:', response);
 
      const token = response.token;
      const userData = response.user ?? {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        active: response.active,
      };
 
      if (!token || !userData) {
        throw new Error('Registration failed: incomplete response');
      }
 
      saveToken(token);
      saveUser(userData);
      setUser(userData);
      setIsAuth(true);
 
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };
 
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeToken();
      removeUser();
      setUser(null);
      setIsAuth(false);
    }
  };
 
  const value = {
    user,
    isAuth,
    isLoading,
    login,
    register,
    logout,
  };
 
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
 
export default AuthProvider;