import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './db.js';
import usersRouter from './routes/users.js';
import medicationsRouter from './routes/medications.js';
import remindersRouter from './routes/reminders.js';
import mealsRouter from './routes/meals.js';
import healthMetricsRouter from './routes/health-metrics.js';
import sleepRouter from './routes/sleep.js';
import emergencyContactsRouter from './routes/emergency-contacts.js';
import drugInteractionsRouter from './routes/drug-interactions.js';
import healthInsightsRouter from './routes/health-insights.js';
import videoSessionsRouter from './routes/video-sessions.js';
import qrCardsRouter from './routes/qr-cards.js';
import circadianRhythmRouter from './routes/circadian-rhythm.js';
import medicationAdherenceRouter from './routes/medication-adherence.js';
import notificationsRouter from './routes/notifications.js';
import nutritionRouter from './routes/nutrition.js';
import authRouter from './routes/auth.js';
import circadianProfileRouter from './routes/circadian-profile.js';
import medicationSchedulerRouter from './routes/medication-scheduler.js';
import circadianInsightsRouter from './routes/circadian-insights.js';
import sosRouter from './routes/sos.js';
import videoRouter from './routes/video.js';
import wearablesRouter from './routes/wearables.js';
import { registerCallSignaling } from './socket/callSignaling.js';
import { startReminderAutomation } from './services/reminderAutomation.js';

console.log("🔑 Gemini API Key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5001;

const CLIENT_PORTS = [8080, 8080, 5173];

const envOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const staticAllowedOrigins = Array.from(
  new Set([
    ...envOrigins,
    'http://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173',
  ])
);

const isLanOrigin = (origin = '') => {
  return /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(origin);
};

const isTryCloudflareOrigin = (origin = '') => {
  return /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin);
};

const isVercelOrigin = (origin = '') => {
  return /\.vercel\.app$/i.test(origin);
};

const corsOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (staticAllowedOrigins.includes(origin) || isLanOrigin(origin) || isTryCloudflareOrigin(origin) || isVercelOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Track connected users by userId
const connectedUsers = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Connect to MongoDB
connectDB();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

app.get('/api/location', (req, res) => {
  res.json({ status: 'ok', location: 'unknown', timestamp: new Date() });
});

app.get('/api/v1/location', (req, res) => {
  res.json({ status: 'ok', location: 'unknown', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ status: 'MediClock backend online', timestamp: new Date() });
});

// Pass connectedUsers to socket signaling
registerCallSignaling(io, connectedUsers);

// Auth Routes
app.use('/api/auth', authRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/video', videoRouter);

// Core Routes
app.use('/api/users', usersRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/v1/medications', medicationsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/v1/reminders', remindersRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/v1/nutrition', nutritionRouter);

// Health & Wellness Routes
app.use('/api/meals', mealsRouter);
app.use('/api/v1/meals', mealsRouter);
app.use('/api/health-metrics', healthMetricsRouter);
app.use('/api/v1/health-metrics', healthMetricsRouter);
app.use('/api/sleep', sleepRouter);
app.use('/api/v1/sleep', sleepRouter);
app.use('/api/circadian-rhythm', circadianRhythmRouter);
app.use('/api/v1/circadian-rhythm', circadianRhythmRouter);

// Emergency & Safety Routes
app.use('/api/emergency-contacts', emergencyContactsRouter);
app.use('/api/v1/emergency-contacts', emergencyContactsRouter);
app.use('/api/sos', sosRouter);
app.use('/api/v1/sos', sosRouter);
app.use('/api/qr-cards', qrCardsRouter);
app.use('/api/v1/qr-cards', qrCardsRouter);

// Alerts compatibility endpoint requested by tunnel clients.
app.get('/api/v1/alerts', (req, res) => {
  const limit = req.query.limit || 20;
  return res.redirect(307, `/api/sos/alerts?limit=${encodeURIComponent(String(limit))}`);
});

// Medical Routes
app.use('/api/drug-interactions', drugInteractionsRouter);
app.use('/api/v1/drug-interactions', drugInteractionsRouter);
app.use('/api/medication-adherence', medicationAdherenceRouter);
app.use('/api/v1/medication-adherence', medicationAdherenceRouter);
app.use('/api/video-sessions', videoSessionsRouter);
app.use('/api/v1/video-sessions', videoSessionsRouter);

// AI & Insights Routes
app.use('/api/health-insights', healthInsightsRouter);
app.use('/api/v1/health-insights', healthInsightsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/wearables', wearablesRouter);
app.use('/api/v1/wearables', wearablesRouter);

// Chronobiology & Scheduling Routes
app.use('/api/circadian-profile', circadianProfileRouter);
app.use('/api/v1/circadian-profile', circadianProfileRouter);
app.use('/api/medication-scheduler', medicationSchedulerRouter);
app.use('/api/v1/medication-scheduler', medicationSchedulerRouter);
app.use('/api/circadian-insights', circadianInsightsRouter);
app.use('/api/v1/circadian-insights', circadianInsightsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server - listen on all interfaces for LAN connectivity
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 LAN Access: http://10.0.8.185:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Connected users: 0`);
  startReminderAutomation();
});