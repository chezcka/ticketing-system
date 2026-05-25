import React, { useState, useEffect } from 'react';
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

  // ✅ Check if user is deactivated on mount
  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();

    if (token && storedUser) {
      // Check if stored user is deactivated
      if (storedUser.status === 'INACTIVE' || storedUser.active === false) {
        console.warn('Deactivated user detected on mount - clearing auth');
        removeToken();
        removeUser();
        setUser(null);
        setIsAuth(false);
      }
    }
  }, []);
 
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      console.log('Login response:', response);

      const token = response.token;
      const userData = response.user ?? {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        active: response.active,
        status: response.status,
      };

      if (!token) {
        console.error('No token in login response');
        throw new Error('Login failed: no token received');
      }

      if (!userData || !userData.role) {
        console.error('No user/role in login response');
        throw new Error('Login failed: no user data received');
      }

      // ✅ CRITICAL: Check if user is deactivated BEFORE saving anything
      if (userData.status === 'INACTIVE' || userData.active === false) {
        console.error('User is deactivated, rejecting login');
        // DO NOT SAVE TOKEN OR USER DATA
        // DO NOT SET AUTH STATE
        // JUST THROW ERROR
        throw new Error('User account is deactivated. Please contact administrator.');
      }

      // ✅ ONLY save if user is ACTIVE
      console.log('User is active, saving auth data');
      saveToken(token);
      saveUser(userData);
      setUser(userData);
      setIsAuth(true);

      return response;
    } catch (error) {
      console.error('Login catch block - error:', error.message);
      
      // ✅ Extract error message from various sources
      const errorMessage = error.response?.data?.message || error.message || '';
      console.log('Error message:', errorMessage);
      
      // ✅ Check for deactivated user error from backend
      if (errorMessage.includes('inactive') || errorMessage.includes('deactivated')) {
        console.error('Backend reported inactive user');
        // Make sure nothing is saved
        removeToken();
        removeUser();
        setUser(null);
        setIsAuth(false);
        throw new Error('User account is deactivated. Please contact administrator.');
      }
      
      // ✅ Check for invalid credentials
      if (errorMessage.includes('Invalid') || errorMessage.includes('password')) {
        console.error('Invalid credentials');
        throw new Error('Invalid email or password. Please try again.');
      }
      
      // ✅ Any other error
      console.error('Generic login error:', errorMessage || error.message);
      throw error;
    }
  };
 
  const register = async (email, password, fullName) => {
    try {
      const response = await authService.register(email, password, fullName);

      console.log('Register response:', response);

      const token = response.token;
      const userData = response.user ?? {
        id: response.id,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
        active: response.active,
        status: response.status,
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