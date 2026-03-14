// API service for connecting frontend to backend
const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) {
    return String(envBase).replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5001/api/v1`;
  }

  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

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
      const response = await fetch(`${API_BASE_URL}/video/token`, {
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
        headers: authHeaders(),
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    getById: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    update: async (userId, userData) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    delete: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(),
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
      const response = await fetch(`${API_BASE_URL}/reminders/today/${userId}`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    create: async (reminderData) => {
      const response = await fetch(`${API_BASE_URL}/reminders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(reminderData),
      });
      return response.json();
    },
    getByUserId: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    getTimeline: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}/timeline`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    sendDueWhatsApp: async (userId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/user/${userId}/send-due-whatsapp`, {
        method: 'POST',
        headers: authHeaders(),
      });
      return response.json();
    },
    getById: async (reminderId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        headers: authHeaders(),
      });
      return response.json();
    },
    update: async (reminderId, reminderData) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(reminderData),
      });
      return response.json();
    },
    complete: async (reminderId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}/complete`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      return response.json();
    },
    delete: async (reminderId) => {
      const response = await fetch(`${API_BASE_URL}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: authHeaders(),
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

  // Nutrition / OCR
  nutrition: {
    analyzePrescription: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/nutrition/analyze-prescription`, {
        method: 'POST',
        body: formData,
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

  // Wearables
  wearables: {
    update: async (wearableData) => {
      const response = await fetch(`${API_BASE_URL}/wearables/update`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(wearableData),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update wearable data');
      }

      return payload;
    },
    getLatest: async () => {
      const response = await fetch(`${API_BASE_URL}/wearables/latest`, {
        headers: authHeaders(),
        cache: 'no-store',
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch wearable data');
      }

      return payload;
    },
    sync: async () => {
      const response = await fetch(`${API_BASE_URL}/wearables/latest`, {
        headers: authHeaders(),
        cache: 'no-store',
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to sync wearable data');
      }

      return payload;
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
