import api from './api';

export const userService = {
  // Authentication methods (existing)
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getUserActivity: async (limit = 20) => {
    try {
      const response = await api.get(`/users/activity`, { params: { limit } });
      return response.data;
    } catch {
      return []; // Return empty array if activity endpoint fails
    }
  },

  getCurrentUser: async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      const response = await api.get('/users/profile');
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Please log in to continue');
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // New User Management methods
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateUserProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  uploadProfilePicture: async (formData) => {
    const response = await api.post('/users/profile/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  updateUserSettings: async (settingsData) => {
    const response = await api.put('/users/settings', settingsData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/users/change-password', passwordData);
    return response.data;
  },

  deactivateAccount: async () => {
    const response = await api.post('/users/deactivate');
    return response.data;
  },

  getAllUsers: async (page = 1, limit = 10) => {
    const response = await api.get('/users/all', { params: { page, limit } });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  logActivity: async (userId, activityData) => {
    const response = await api.post(`/users/${userId}/activity`, activityData);
    return response.data;
  },
};

export default userService;
