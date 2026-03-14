# MediClock Database Models Documentation

Complete reference for all MongoDB models used in the MediClock application.

## Core Models (3)

### 1. **User**
Stores user account and profile information.

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  age: Number,
  sleepSchedule: {
    wakeTime: String,
    sleepTime: String
  },
  healthConditions: [String],
  role: String enum ('user', 'doctor'),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Medication**
Tracks user medications.

```javascript
{
  userId: ObjectId,
  name: String,
  dosage: String,
  frequency: String enum ('once daily', 'twice daily', 'three times daily', 'as needed'),
  reason: String,
  sideEffects: [String],
  interactions: [String],
  prescribedDate: Date,
  endDate: Date,
  status: String enum ('active', 'inactive', 'completed'),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Reminder**
Medication reminder schedules.

```javascript
{
  userId: ObjectId,
  medicationId: ObjectId (ref),
  time: String (HH:MM),
  daysOfWeek: [Number], // 0-6
  description: String,
  isCompleted: Boolean,
  lastTakenAt: Date,
  nextDueAt: Date,
  status: String enum ('active', 'inactive', 'snoozed'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Health & Wellness Models (4)

### 4. **MealLog**
Nutrition tracking.

**Routes:** `POST /api/meals`, `GET /api/meals/user/:userId`, `GET /api/meals/user/:userId/date/:date`, `GET /api/meals/user/:userId/summary/:date`

```javascript
{
  userId: ObjectId,
  mealType: String enum ('Breakfast', 'Lunch', 'Dinner', 'Snacks'),
  items: String,
  calories: Number,
  macros: {
    protein: Number,
    carbs: Number,
    fat: Number,
    sugar: Number
  },
  time: String (HH:MM),
  date: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **HealthMetrics**
Vital signs and health measurements.

**Routes:** `POST /api/health-metrics`, `GET /api/health-metrics/user/:userId`, `GET /api/health-metrics/user/:userId/latest`

```javascript
{
  userId: ObjectId,
  date: Date,
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  bloodSugar: {
    value: Number,
    unit: String enum ('mg/dL', 'mmol/L')
  },
  heartRate: Number (BPM),
  spO2: Number (%),
  temperature: {
    value: Number,
    unit: String enum ('C', 'F')
  },
  weight: Number (kg),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **SleepData**
Sleep tracking and quality metrics.

**Routes:** `POST /api/sleep`, `GET /api/sleep/user/:userId`, `GET /api/sleep/user/:userId/week/:startDate`, `GET /api/sleep/user/:userId/analytics`

```javascript
{
  userId: ObjectId,
  date: Date,
  hours: Number,
  quality: String enum ('excellent', 'good', 'fair', 'poor'),
  bedTime: String (HH:MM),
  wakeTime: String (HH:MM),
  interruptions: Number,
  deepSleepHours: Number,
  remSleepHours: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **CircadianRhythmData**
Hourly circadian rhythm and optimal timing data.

**Routes:** `POST /api/circadian-rhythm`, `GET /api/circadian-rhythm/user/:userId/date/:date`, `GET /api/circadian-rhythm/user/:userId/latest`, `GET /api/circadian-rhythm/user/:userId/optimal-times/:date`

```javascript
{
  userId: ObjectId,
  date: Date,
  hourlyReadings: [{
    hour: Number (0-23),
    cortisol: Number,
    melatonin: Number,
    temperature: Number,
    alertness: Number (0-10)
  }],
  sleepScore: Number (0-100),
  optimalMedicationTimes: [{
    hour: Number,
    medication: String,
    reason: String
  }],
  recommendedBedTime: String (HH:MM),
  recommendedWakeTime: String (HH:MM),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Emergency & Safety Models (2)

### 8. **EmergencyContact**
Emergency contacts for SOS feature.

**Routes:** `POST /api/emergency-contacts`, `GET /api/emergency-contacts/user/:userId`, `GET /api/emergency-contacts/user/:userId/primary`, `POST /api/emergency-contacts/user/:userId/notify-all`

```javascript
{
  userId: ObjectId,
  name: String,
  phone: String,
  relationship: String enum ('Family', 'Doctor', 'Friend', 'Spouse', 'Other'),
  email: String,
  isPrimary: Boolean,
  lastNotified: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **QRCard**
Health QR card for emergency information.

**Routes:** `POST /api/qr-cards`, `GET /api/qr-cards/user/:userId`, `GET /api/qr-cards/public/:qrUrl`, `PATCH /api/qr-cards/:id/toggle-public`

```javascript
{
  userId: ObjectId,
  healthData: {
    bloodType: String,
    allergies: [String],
    medications: [String],
    emergencyContacts: [{
      name: String,
      phone: String
    }],
    medicalConditions: [String],
    doctorName: String,
    doctorPhone: String
  },
  qrCode: String (Base64),
  qrUrl: String,
  isPublic: Boolean,
  generatedDate: Date,
  lastUpdated: Date,
  expiryDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Medical & Treatment Models (3)

### 10. **DrugInteraction**
Known drug interactions database.

**Routes:** `POST /api/drug-interactions`, `GET /api/drug-interactions/check?drugA=X&drugB=Y`, `POST /api/drug-interactions/check-multiple`

```javascript
{
  drugA: String (lowercase),
  drugB: String (lowercase),
  severity: String enum ('low', 'medium', 'high'),
  spacing: String,
  note: String,
  source: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 11. **MedicationAdherence**
Track medication compliance.

**Routes:** `POST /api/medication-adherence`, `GET /api/medication-adherence/user/:userId`, `GET /api/medication-adherence/user/:userId/rate`, `GET /api/medication-adherence/user/:userId/date/:date`

```javascript
{
  userId: ObjectId,
  medicationId: ObjectId (ref),
  reminderId: ObjectId (ref),
  date: Date,
  status: String enum ('taken', 'missed', 'skipped', 'pending'),
  timeScheduled: String (HH:MM),
  timeTaken: String (HH:MM),
  dosageTaken: String,
  notes: String,
  reason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 12. **VideoSession**
Doctor video consultation sessions.

**Routes:** `POST /api/video-sessions`, `GET /api/video-sessions/user/:userId`, `GET /api/video-sessions/user/:userId/upcoming`, `PATCH /api/video-sessions/:id/start`, `PATCH /api/video-sessions/:id/end`

```javascript
{
  userId: ObjectId,
  doctorId: ObjectId,
  title: String,
  description: String,
  scheduledTime: Date,
  startTime: Date,
  endTime: Date,
  status: String enum ('scheduled', 'ongoing', 'completed', 'cancelled'),
  roomId: String,
  notes: String,
  prescription: String,
  recordingUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## AI & Insights Models (2)

### 13. **HealthInsight**
Personalized health insights and suggestions.

**Routes:** `POST /api/health-insights`, `GET /api/health-insights/user/:userId/unread`, `GET /api/health-insights/user/:userId`, `PATCH /api/health-insights/:id/read`

```javascript
{
  userId: ObjectId,
  title: String,
  description: String,
  category: String enum ('medication', 'nutrition', 'sleep', 'exercise', 'health', 'warning'),
  severity: String enum ('info', 'warning', 'critical'),
  isRead: Boolean,
  actionUrl: String,
  relatedData: ObjectId,
  relatedModel: String enum ('Medication', 'MealLog', 'SleepData', 'HealthMetrics'),
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 14. **NotificationLog**
All system notifications sent to users.

**Routes:** `POST /api/notifications`, `GET /api/notifications/user/:userId`, `GET /api/notifications/user/:userId/unread`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/user/:userId/read-all`, `DELETE /api/notifications/user/:userId/clear-old`

```javascript
{
  userId: ObjectId,
  reminderId: ObjectId (optional),
  medicationId: ObjectId (optional),
  type: String enum ('reminder', 'alert', 'insight', 'emergency'),
  channel: String enum ('mobile', 'email', 'sms', 'whatsapp', 'push'),
  title: String,
  message: String,
  sentAt: Date,
  isDelivered: Boolean,
  isRead: Boolean,
  deliveredAt: Date,
  readAt: Date,
  status: String enum ('pending', 'sent', 'delivered', 'failed'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoint Summary

### Health Check
- `GET /api/health` - Server health status

### User Management
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Medications (6 endpoints)
- Create, Read, Update, Delete medications
- Get medications by user

### Reminders (7 endpoints)
- Create, Read, Update, Delete
- Mark as completed
- Get by user

### Meals (6 endpoints)
- Log meals
- Get meals by date/user
- Get nutrition summary

### Health Metrics (5 endpoints)
- Record vital signs
- Get metrics by date range
- Get latest metrics

### Sleep (7 endpoints)
- Record sleep data
- Get weekly analytics
- Get sleep quality breakdown

### Emergency Contacts (6 endpoints)
- Manage emergency contacts
- SOS notification broadcast

### Drug Interactions (5 endpoints)
- Check pairwise interactions
- Check multiple drug combinations
- Maintain interaction database

### Health Insights (5 endpoints)
- Get personalized insights
- Mark as read
- Filter by category/severity

### Video Sessions (8 endpoints)
- Schedule sessions
- Manage session lifecycle
- Track doctor consultations

### QR Cards (6 endpoints)
- Generate health QR cards
- Public/private toggle
- Share medical info

### Circadian Rhythm (5 endpoints)
- Track hormone levels
- Get optimal medication times
- Sleep score predictions

### Medication Adherence (5 endpoints)
- Track compliance
- Get adherence rates
- Detailed daily breakdown

### Notifications (8 endpoints)
- Log notifications
- Mark read/delivered
- Bulk operations
- Clear old notifications

---

## Indexes for Performance

All collections have optimized indexes:
- `userId` - Most common queries filtered by user
- `date` - Time-based queries
- `status` - Status filtering
- Compound indexes for multi-field queries

## Total Models: 14
- **Core**: 3 (User, Medication, Reminder)
- **Health & Wellness**: 4
- **Emergency & Safety**: 2
- **Medical & Treatment**: 3
- **AI & Insights**: 2

**Total API Endpoints**: 100+
