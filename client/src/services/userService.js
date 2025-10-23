import api from './api';

// User service functions
export const userService = {
  // Get all users with pagination
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user by ID
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get users for task assignment
  getAssignableUsers: async (projectId = null) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/users/assignable', { params });
    return response.data;
  },

  // Get online users
  getOnlineUsers: async () => {
    const response = await api.get('/users/online');
    return response.data;
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    const response = await api.get('/users/search', { 
      params: { q: query, limit } 
    });
    return response.data;
  },

  // Update user (admin only)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

    // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update current user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/users/change-password', passwordData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};