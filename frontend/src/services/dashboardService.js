import api from './api';

const emptySummary = {
  stats: {
    availableClubs: 0,
    clubsOwned: 0,
    joinedClubs: 0,
    registeredEvents: 0,
    upcomingRegistrations: 0,
    pendingPayments: 0,
    unreadNotifications: 0,
  },
  myClubs: [],
  upcomingEvents: [],
  announcements: [],
};

export const dashboardService = {
  /**
   * Single request for the whole dashboard. Replaces the previous
   * /clubs + /clubs/my-clubs + /events/registered fan-out.
   */
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/dashboard/summary');
      return { ...emptySummary, ...response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load your dashboard');
    }
  },

  // Kept for backwards compatibility with older callers.
  getDashboardStats: async () => {
    const { stats } = await dashboardService.getDashboardSummary();
    return stats;
  },

  getRecentActivity: async () => {
    try {
      const response = await api.get('/activity/recent');
      return response.data;
    } catch (error) {
      return [];
    }
  },
};

export default dashboardService;
