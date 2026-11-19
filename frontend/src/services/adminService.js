import api from './api';

class AdminService {
  // Dashboard & Statistics
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  }

  async getSystemStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  }

  async getSystemHealth() {
    const response = await api.get('/admin/health');
    return response.data;
  }

  // User Management
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data.data || response.data;
  }

  async toggleUserStatus(userId) {
    const response = await api.put(`/admin/users/${userId}/toggle-status`);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async bulkUserAction(data) {
    const response = await api.post('/admin/users/bulk-action', data);
    return response.data;
  }

  // Club Management
  async getAllClubs() {
    const response = await api.get('/clubs');
    return response.data;
  }

  async getPendingClubs() {
    const response = await api.get('/admin/clubs/pending');
    return response.data.data || response.data;
  }

  async approveClub(clubId) {
    const response = await api.put(`/admin/clubs/${clubId}/approve`);
    return response.data;
  }

  async rejectClub(clubId, reason) {
    const response = await api.put(`/admin/clubs/${clubId}/reject`, { reason });
    return response.data;
  }

  // Payment Management
  async getPendingPayments() {
    const response = await api.get('/admin/payments/pending');
    return response.data.data || response.data;
  }

  async approvePayment(paymentId) {
    const response = await api.put(`/admin/payments/${paymentId}/approve`);
    return response.data;
  }

  async rejectPayment(paymentId, reason) {
    const response = await api.put(`/admin/payments/${paymentId}/reject`, { reason });
    return response.data;
  }

  // Feedback Management
  async updateFeedbackStatus(feedbackId, statusData) {
    const response = await api.put(`/feedback/${feedbackId}/status`, statusData);
    return response.data;
  }

  async getAllFeedback(params = {}) {
    const response = await api.get('/feedback', { params: { ...params, admin: true } });
    return response.data.data || response.data;
  }

  // Reports & Analytics
  async generateSystemReport(params = {}) {
    const response = await api.get('/admin/reports/system', { params });
    return response.data.data || response.data;
  }

  async getAnalytics(filters = {}) {
    const response = await api.get('/admin/analytics', { params: filters });
    return response.data.data || response.data;
  }
}

export const adminService = new AdminService();
export default adminService;
