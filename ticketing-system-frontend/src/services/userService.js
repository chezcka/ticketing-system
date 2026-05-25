import api from './api';

// ============================================================================
// USER AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Login user and return authentication response
 * Returns: { id, email, fullName, role, message }
 * Throws: Error with specific message for deactivated users
 */
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });

    // Store token if returned
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
    }

    return response.data.data;
  } catch (error) {
    console.error('Login error:', error.response?.data?.message || error.message);

    const errorMessage = error.response?.data?.message || error.message;

    if (errorMessage.includes('inactive') || errorMessage.includes('deactivated')) {
      throw new Error('User account is deactivated. Please contact administrator.');
    }

    if (errorMessage.includes('Invalid email or password')) {
      throw new Error('Invalid email or password');
    }

    throw new Error(errorMessage || 'Login failed');
  }
};

/**
 * Get current user profile
 */
export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }
};

// ============================================================================
// USER MANAGEMENT ENDPOINTS (ADMIN)
// ============================================================================

/**
 * Get all users (non-deleted only)
 * GET /api/auth/users
 */
export const getAllUsers = async () => {
  try {
    console.log('Fetching all users...');
    const response = await api.get('/auth/users');
    console.log('Users fetched successfully:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching users:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      headers: error.config?.headers,
    });
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/auth/users/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Create new support agent
 * Builds fullName from firstName + lastName
 * Password defaults to Agent@123456 on the backend if not provided
 */
export const createUser = async (userData) => {
  try {
    const payload = {
      fullName: `${userData.firstName} ${userData.lastName}`.trim(),
      email: userData.email,
      department: userData.department || null,
      // password intentionally omitted — backend defaults to Agent@123456
    };
    const response = await api.post('/auth/register-agent', payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create user');
  }
};

/**
 * Update user profile (email, name, phone, department, status, password)
 */
export const updateUserProfile = async (id, userData) => {
  try {
    const response = await api.put(`/auth/users/${id}`, userData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Deactivate user (soft delete via status change)
 * PUT /api/auth/users/{id}/deactivate
 */
export const deactivateUser = async (id) => {
  try {
    const response = await api.put(`/auth/users/${id}/deactivate`);
    return response.data.data;
  } catch (error) {
    console.error('Error deactivating user:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to deactivate user');
  }
};

/**
 * Reactivate user
 * PUT /api/auth/users/{id}/reactivate
 */
export const reactivateUser = async (id) => {
  try {
    const response = await api.put(`/auth/users/${id}/reactivate`);
    return response.data.data;
  } catch (error) {
    console.error('Error reactivating user:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to reactivate user');
  }
};

/**
 * Delete user (permanent hard delete)
 * DELETE /api/auth/users/{id}
 */
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting user:', error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (id, preferences) => {
  try {
    const response = await api.put(`/auth/users/${id}`, {
      notificationPreferences: preferences,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};