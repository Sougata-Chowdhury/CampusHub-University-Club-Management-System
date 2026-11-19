import api from './api';

class ReportService {
  // Report types and categories
  getReportTypes() {
    return [
      { value: 'event', label: 'Event' },
      { value: 'club', label: 'Club' },
      { value: 'announcement', label: 'Announcement' },
    ];
  }

  getReportCategories() {
    return [
      { value: 'inappropriate_content', label: 'Inappropriate Content' },
      { value: 'spam', label: 'Spam' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'misleading_info', label: 'Misleading Information' },
      { value: 'violation_of_rules', label: 'Violation of Rules' },
      { value: 'other', label: 'Other' },
    ];
  }

  getReportStatuses() {
    return [
      { value: 'pending', label: 'Pending' },
      { value: 'under_review', label: 'Under Review' },
      { value: 'action_taken', label: 'Action Taken' },
      { value: 'dismissed', label: 'Dismissed' },
      { value: 'resolved', label: 'Resolved' },
    ];
  }

  // Create a new report
  async createReport(reportData, attachments = []) {
    const formData = new FormData();
    
    // Add report data
    Object.keys(reportData).forEach(key => {
      if (reportData[key] !== undefined && reportData[key] !== null) {
        formData.append(key, reportData[key]);
      }
    });

    // Add attachments
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    const response = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get user's reports
  async getUserReports(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    const response = await api.get(`/reports/my-reports?${params}`);
    return response.data;
  }

  // Admin functions
  async getAllReports(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    const response = await api.get(`/reports?${params}`);
    return response.data;
  }

  async updateReportStatus(reportId, status, adminNotes = '', actionTaken = '') {
    const response = await api.put(`/reports/${reportId}/status`, {
      status,
      adminNotes,
      actionTaken,
    });
    return response.data;
  }

  async takeActionOnReportedItem(reportId) {
    const response = await api.post(`/reports/${reportId}/take-action`);
    return response.data;
  }

  async deleteReport(reportId) {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  }

  async getReportStats() {
    const response = await api.get('/reports/stats');
    return response.data;
  }

  // Utility functions
  getStatusColor(status) {
    const statusColors = {
      pending: '#ff9800',
      under_review: '#2196f3',
      action_taken: '#4caf50',
      dismissed: '#f44336',
      resolved: '#4caf50',
    };
    return statusColors[status] || '#9e9e9e';
  }

  getStatusIcon(status) {
    const statusIcons = {
      pending: '⏳',
      under_review: '🔍',
      action_taken: '✅',
      dismissed: '❌',
      resolved: '✅',
    };
    return statusIcons[status] || '📄';
  }

  getCategoryIcon(category) {
    const categoryIcons = {
      inappropriate_content: '🚫',
      spam: '📧',
      harassment: '⚠️',
      misleading_info: '❓',
      violation_of_rules: '📋',
      other: '📝',
    };
    return categoryIcons[category] || '📝';
  }

  getTypeIcon(type) {
    const typeIcons = {
      event: '📅',
      club: '🏛️',
      announcement: '📢',
    };
    return typeIcons[type] || '📄';
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Check if user can report an item (to prevent duplicate reports)
  async canUserReport(type, targetId) {
    try {
      const userReports = await this.getUserReports(1, 100, { type });
      const pendingReport = userReports.reports.find(
        report => 
          report.targetId === targetId && 
          ['pending', 'under_review'].includes(report.status)
      );
      return !pendingReport;
    } catch (error) {
      console.error('Error checking if user can report:', error);
      return true; // Allow reporting if check fails
    }
  }
}

const reportService = new ReportService();

export default reportService;
