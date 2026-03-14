// API service for connecting frontend to backend
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios-like fetch wrapper
export const api = {
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

  // Health check
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

export default api;
