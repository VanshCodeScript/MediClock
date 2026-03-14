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
import { registerCallSignaling } from './socket/callSignaling.js';
import { startReminderAutomation } from './services/reminderAutomation.js';

console.log("🔑 Gemini API Key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5001;
const allowedOrigins = Array.from(
  new Set(
    [
      process.env.CORS_ORIGIN,
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://localhost:5173',
    ].filter(Boolean)
  )
);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Connect to MongoDB
connectDB();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

registerCallSignaling(io);

// Auth Routes
app.use('/api/auth', authRouter);
app.use('/api/v1/video', videoRouter);

// Core Routes
app.use('/api/users', usersRouter);
app.use('/api/medications', medicationsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/nutrition', nutritionRouter);

// Health & Wellness Routes
app.use('/api/meals', mealsRouter);
app.use('/api/health-metrics', healthMetricsRouter);
app.use('/api/sleep', sleepRouter);
app.use('/api/circadian-rhythm', circadianRhythmRouter);

// Emergency & Safety Routes
app.use('/api/emergency-contacts', emergencyContactsRouter);
app.use('/api/sos', sosRouter);
app.use('/api/qr-cards', qrCardsRouter);

// Medical Routes
app.use('/api/drug-interactions', drugInteractionsRouter);
app.use('/api/medication-adherence', medicationAdherenceRouter);
app.use('/api/video-sessions', videoSessionsRouter);

// AI & Insights Routes
app.use('/api/health-insights', healthInsightsRouter);
app.use('/api/notifications', notificationsRouter);

// Chronobiology & Scheduling Routes
app.use('/api/circadian-profile', circadianProfileRouter);
app.use('/api/medication-scheduler', medicationSchedulerRouter);
app.use('/api/circadian-insights', circadianInsightsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  startReminderAutomation();
});
