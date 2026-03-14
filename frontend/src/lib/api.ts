// API service for connecting frontend to backend
const API_BASE_URL = 'http://localhost:5001/api';

const authHeaders = () => {
  const token = localStorage.getItem('mediclock_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
};

// Create axios-like fetch wrapper
export const api = {
  // Auth
  auth: {
    register: async (userData: { name: string; email: string; password: string; age?: number; gender?: string; phone?: string }) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    login: async (credentials: { email: string; password: string }) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response.json();
    },
    me: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    logout: () => {
      localStorage.removeItem('mediclock_token');
      localStorage.removeItem('mediclock_user');
      localStorage.removeItem('mediclock_user_id');
    },
  },

  // Video
  video: {
    generateToken: async (payload: { identity: string; room?: string }) => {
      const response = await fetch(`${API_BASE_URL}/v1/video/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
  },

  // Users
  users: {
    create: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/users`);
      return response.json();
    },
    getById: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      return response.json();
    },
    update: async (userId, userData) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    delete: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Medications
  medications: {
    create: async (medicationData) => {
      const response = await fetch(`${API_BASE_URL}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicationData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/medications/user/${userId}`);
      return response.json();
    },
    getById: async (medicationId) => {
      const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`);
      return response.json();
    },
    update: async (medicationId, medicationData) => {
      const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicationData),
      });
      return response.json();
    },
    delete: async (medicationId) => {
      const response = await fetch(`${API_BASE_URL}/medications/${medicationId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Reminders
  reminders: {
    today: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/reminders/today/${userId}`);
      return response.json();
    },
    create: async (reminderData) => {
      const response = await fetch(`${API_BASE_URL}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}`);
      return response.json();
    },
    getTimeline: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}/timeline`);
      return response.json();
    },
    sendDueWhatsApp: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}/send-due-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    getById: async (reminderId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`);
      return response.json();
    },
    update: async (reminderId, reminderData) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });
      return response.json();
    },
    complete: async (reminderId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    delete: async (reminderId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Meals
  meals: {
    create: async (mealData) => {
      const response = await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      return response.json();
    },
    getByUserAndDate: async (userId, date) => {
      const response = await fetch(`${API_BASE_URL}/meals/user/${userId}/date/${date}`);
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/meals/user/${userId}`);
      return response.json();
    },
    getSummary: async (userId, date) => {
      const response = await fetch(`${API_BASE_URL}/meals/user/${userId}/summary/${date}`);
      return response.json();
    },
    update: async (mealId, mealData) => {
      const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      return response.json();
    },
    delete: async (mealId) => {
      const response = await fetch(`${API_BASE_URL}/meals/${mealId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Health Metrics
  healthMetrics: {
    create: async (metricsData) => {
      const response = await fetch(`${API_BASE_URL}/health-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/health-metrics/user/${userId}`);
      return response.json();
    },
    getLatest: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/health-metrics/user/${userId}/latest`);
      return response.json();
    },
    update: async (metricsId, metricsData) => {
      const response = await fetch(`${API_BASE_URL}/health-metrics/${metricsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsData),
      });
      return response.json();
    },
    delete: async (metricsId) => {
      const response = await fetch(`${API_BASE_URL}/health-metrics/${metricsId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Sleep
  sleep: {
    create: async (sleepData) => {
      const response = await fetch(`${API_BASE_URL}/sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sleepData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/sleep/user/${userId}`);
      return response.json();
    },
    getWeek: async (userId, startDate) => {
      const response = await fetch(`${API_BASE_URL}/sleep/user/${userId}/week/${startDate}`);
      return response.json();
    },
    getAnalytics: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/sleep/user/${userId}/analytics`);
      return response.json();
    },
    update: async (sleepId, sleepData) => {
      const response = await fetch(`${API_BASE_URL}/sleep/${sleepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sleepData),
      });
      return response.json();
    },
    delete: async (sleepId) => {
      const response = await fetch(`${API_BASE_URL}/sleep/${sleepId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Emergency Contacts
  emergencyContacts: {
    create: async (contactData) => {
      const response = await fetch(`${API_BASE_URL}/emergency-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/emergency-contacts/user/${userId}`);
      return response.json();
    },
    getPrimary: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/emergency-contacts/user/${userId}/primary`);
      return response.json();
    },
    update: async (contactId, contactData) => {
      const response = await fetch(`${API_BASE_URL}/emergency-contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      return response.json();
    },
    delete: async (contactId) => {
      const response = await fetch(`${API_BASE_URL}/emergency-contacts/${contactId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    notifyAll: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/emergency-contacts/user/${userId}/notify-all`, {
        method: 'POST',
      });
      return response.json();
    },
  },

  // Drug Interactions
  drugInteractions: {
    checkPair: async (drugA, drugB) => {
      const response = await fetch(
        `${API_BASE_URL}/drug-interactions/check?drugA=${drugA}&drugB=${drugB}`
      );
      return response.json();
    },
    checkMultiple: async (drugs) => {
      const response = await fetch(`${API_BASE_URL}/drug-interactions/check-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs }),
      });
      return response.json();
    },
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/drug-interactions`);
      return response.json();
    },
  },

  // Health Insights
  healthInsights: {
    create: async (insightData) => {
      const response = await fetch(`${API_BASE_URL}/health-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insightData),
      });
      return response.json();
    },
    getUnread: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/health-insights/user/${userId}/unread`);
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/health-insights/user/${userId}`);
      return response.json();
    },
    markAsRead: async (insightId) => {
      const response = await fetch(`${API_BASE_URL}/health-insights/${insightId}/read`, {
        method: 'PATCH',
      });
      return response.json();
    },
    delete: async (insightId) => {
      const response = await fetch(`${API_BASE_URL}/health-insights/${insightId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Video Sessions
  videoSessions: {
    create: async (sessionData) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions/user/${userId}`);
      return response.json();
    },
    getUpcoming: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions/user/${userId}/upcoming`);
      return response.json();
    },
    update: async (sessionId, sessionData) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      return response.json();
    },
    start: async (sessionId) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions/${sessionId}/start`, {
        method: 'PATCH',
      });
      return response.json();
    },
    end: async (sessionId) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions/${sessionId}/end`, {
        method: 'PATCH',
      });
      return response.json();
    },
    cancel: async (sessionId) => {
      const response = await fetch(`${API_BASE_URL}/video-sessions/${sessionId}/cancel`, {
        method: 'PATCH',
      });
      return response.json();
    },
  },

  // QR Cards
  qrCards: {
    create: async (cardData) => {
      const response = await fetch(`${API_BASE_URL}/qr-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/qr-cards/user/${userId}`);
      return response.json();
    },
    getPublic: async (qrUrl) => {
      const response = await fetch(`${API_BASE_URL}/qr-cards/public/${qrUrl}`);
      return response.json();
    },
    update: async (cardId, cardData) => {
      const response = await fetch(`${API_BASE_URL}/qr-cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });
      return response.json();
    },
    togglePublic: async (cardId) => {
      const response = await fetch(`${API_BASE_URL}/qr-cards/${cardId}/toggle-public`, {
        method: 'PATCH',
      });
      return response.json();
    },
  },

  // Circadian Rhythm
  circadianRhythm: {
    create: async (rhythmData) => {
      const response = await fetch(`${API_BASE_URL}/circadian-rhythm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rhythmData),
      });
      return response.json();
    },
    getByDate: async (userId, date) => {
      const response = await fetch(
        `${API_BASE_URL}/circadian-rhythm/user/${userId}/date/${date}`
      );
      return response.json();
    },
    getLatest: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/circadian-rhythm/user/${userId}/latest`);
      return response.json();
    },
    getOptimalTimes: async (userId, date) => {
      const response = await fetch(
        `${API_BASE_URL}/circadian-rhythm/user/${userId}/optimal-times/${date}`
      );
      return response.json();
    },
  },

  // Circadian Profile
  circadianProfile: {
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/circadian-profile/user/${userId}`);
      return response.json();
    },
    upsert: async (profileData) => {
      const response = await fetch(`${API_BASE_URL}/circadian-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      return response.json();
    },
  },

  // Circadian Insights
  circadianInsights: {
    generateHealthSuggestions: async (payload) => {
      const response = await fetch(`${API_BASE_URL}/circadian-insights/health-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
    getHealthSuggestionsByUserId: async (userId, useLLM = true) => {
      const response = await fetch(
        `${API_BASE_URL}/circadian-insights/health-suggestions/user/${userId}?useLLM=${useLLM}`
      );
      return response.json();
    },
  },

  // Medication Adherence
  medicationAdherence: {
    create: async (adherenceData) => {
      const response = await fetch(`${API_BASE_URL}/medication-adherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adherenceData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/medication-adherence/user/${userId}`);
      return response.json();
    },
    getRate: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/medication-adherence/user/${userId}/rate`);
      return response.json();
    },
    getByDate: async (userId, date) => {
      const response = await fetch(
        `${API_BASE_URL}/medication-adherence/user/${userId}/date/${date}`
      );
      return response.json();
    },
  },

  // Notifications
  notifications: {
    create: async (notificationData) => {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`);
      return response.json();
    },
    getUnread: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread`);
      return response.json();
    },
    markAsRead: async (notificationId) => {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      return response.json();
    },
    markAllAsRead: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
      });
      return response.json();
    },
    delete: async (notificationId) => {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  // Health check
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

export default api;
