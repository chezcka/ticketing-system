import api from './api';

export const getAllUsers = async () => {
  try {
    const response = await api.get('/auth/users');
    console.log('getAllUsers response:', response.data);

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await api.get(`/auth/users/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

/**
 * Create a new user (admin only).
 *
 * Routing:
 *   SUPPORT_AGENT -> POST /auth/register-agent  (fullName, email, password only)
 *   CLIENT        -> POST /auth/register         (fullName, email, password only)
 *
 * Neither registration endpoint accepts `department` in its DTO, so if a
 * department is supplied we immediately follow up with PUT /auth/users/{id}
 * to save it — making it visible on the list without a manual edit step.
 *
 * Passwords:
 *   SUPPORT_AGENT -> Agent@123456
 *   CLIENT        -> Client@123456
 */
export const createUser = async (userData) => {
  const fullName = `${userData.firstName} ${userData.lastName}`.trim();

  try {
    let response;

    if (userData.role === 'SUPPORT_AGENT') {
      const payload = {
        fullName,
        email: userData.email,
        password: 'Agent@123456',
      };
      console.log('Creating support agent:', { ...payload, password: '[REDACTED]' });
      response = await api.post('/auth/register-agent', payload);
    } else {
      const payload = {
        fullName,
        email: userData.email,
        password: 'Client@123456',
      };
      console.log('Creating client:', { ...payload, password: '[REDACTED]' });
      response = await api.post('/auth/register', payload);
    }

    let created = response.data.data || response.data;
    console.log('User created:', created);

    // Immediately patch department if provided, so it shows without a manual edit.
    if (userData.department && created?.id) {
      try {
        console.log('Patching department for user', created.id);
        const updated = await api.put(`/auth/users/${created.id}`, {
          department: userData.department,
        });
        // Use the updated record so the returned object already has the department.
        created = updated.data.data || updated.data || created;
        console.log('Department saved:', created.department);
      } catch (deptError) {
        // Non-fatal: user was created successfully, only the department patch failed.
        console.warn('Department patch failed:', deptError.response?.data || deptError.message);
      }
    }

    return created;

  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to create user'
    );
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/auth/users/${userId}`, userData);
    console.log('User updated:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error(error.response?.data?.error || 'Failed to update profile');
  }
};

export const deleteUser = async (userId) => {
  try {
    await api.delete(`/auth/users/${userId}`);
    console.log('User deleted:', userId);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete user');
  }
};

export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const response = await api.put(`/auth/users/${userId}`, {
      notificationPreferences: preferences,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};