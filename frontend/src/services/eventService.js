import api from './api';

const fail = (error, fallback) =>
  new Error(error?.response?.data?.message || error?.message || fallback);

export const eventService = {
  // All active events (without computed status)
  getAllEvents: async () => {
    try {
      const { data } = await api.get('/events');
      return data;
    } catch (error) {
      throw fail(error, 'Failed to fetch events');
    }
  },

  // All active events with computed `status` and `timeUntil` fields
  browseEvents: async () => {
    try {
      const { data } = await api.get('/events/browse');
      return data;
    } catch (error) {
      throw fail(error, 'Failed to fetch events');
    }
  },

  getEventById: async (id) => {
    try {
      const { data } = await api.get(`/events/${id}`);
      return data;
    } catch (error) {
      throw fail(error, 'Failed to fetch event');
    }
  },

  // Events the current user created for clubs they own
  getMyEvents: async () => {
    try {
      const { data } = await api.get('/events/my-events');
      return data;
    } catch (error) {
      throw fail(error, 'Failed to fetch your events');
    }
  },

  // Events the current user is registered for
  getRegisteredEvents: async () => {
    try {
      const { data } = await api.get('/events/registered');
      return data;
    } catch (error) {
      throw fail(error, 'Failed to fetch registered events');
    }
  },

  getEventsByClub: async (clubId) => {
    try {
      const { data } = await api.get(`/events/club/${clubId}`);
      return data;
    } catch (error) {
      throw fail(error, 'Failed to fetch club events');
    }
  },

  createEvent: async (eventData) => {
    try {
      const { data } = await api.post('/events', eventData);
      return data;
    } catch (error) {
      throw fail(error, 'Failed to create event');
    }
  },

  updateEvent: async (id, eventData) => {
    try {
      const { data } = await api.put(`/events/${id}`, eventData);
      return data;
    } catch (error) {
      throw fail(error, 'Failed to update event');
    }
  },

  deleteEvent: async (id) => {
    try {
      await api.delete(`/events/${id}`);
    } catch (error) {
      throw fail(error, 'Failed to delete event');
    }
  },

  joinEvent: async (id) => {
    try {
      const { data } = await api.post(`/events/${id}/join`);
      return data;
    } catch (error) {
      throw fail(error, 'Failed to join event');
    }
  },

  leaveEvent: async (id) => {
    try {
      const { data } = await api.delete(`/events/${id}/leave`);
      return data;
    } catch (error) {
      throw fail(error, 'Failed to leave event');
    }
  },
};

export default eventService;
