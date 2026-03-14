# Backend Setup Guide - MongoDB Connection

## Step 1: Get Your MongoDB Password

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Login to your account
3. Navigate to your Cluster0
4. Click "Database" → "Users"
5. Find user `ankitxyz804_db_user`
6. Click "Edit" to view/reset password

## Step 2: Update .env File

Replace `your_password` in `.env` with your actual MongoDB password:

```
MONGODB_URI=mongodb+srv://ankitxyz804_db_user:YOUR_ACTUAL_PASSWORD@cluster0.jcq1wvj.mongodb.net/?appName=Cluster0
```

**Example:**
```
MONGODB_URI=mongodb+srv://ankitxyz804_db_user:MyP@ssw0rd123@cluster0.jcq1wvj.mongodb.net/?appName=Cluster0
```

## Step 3: Whitelist Your IP (Important!)

1. In MongoDB Atlas, go to **Network Access**
2. Click "Add IP Address"
3. Add your current IP or choose "Allow access from anywhere" (0.0.0.0/0) for development
4. Click "Confirm"

## Step 4: Start the Backend

```bash
npm run dev
```

## File Locations

- **Frontend:** `c:\Users\palas\Desktop\SIES\MediClock\frontend`
- **Backend:** `c:\Users\palas\Desktop\SIES\MediClock\backend`
- **Environment file:** `c:\Users\palas\Desktop\SIES\MediClock\backend\.env`

## Running Both Services

### Terminal 1 - Backend (port 5001)
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend (port 8080)
```bash
cd frontend
npm run dev
```

## Verify Connection

Once both are running:

1. **Backend health check:** http://localhost:5001/api/health
2. **Frontend:** http://localhost:8080

The frontend API service is ready to make calls to the backend!

## Example Usage in Frontend

```typescript
import api from '@/lib/api';

// Create a user
const user = await api.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Get all medications for a user
const medications = await api.medications.getByUserId(userId);

// Create a reminder
const reminder = await api.reminders.create({
  userId,
  medicationId,
  time: '09:00',
  daysOfWeek: [1, 3, 5]
});
```
