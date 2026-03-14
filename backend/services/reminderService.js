import Medication from '../models/Medication.js';
import Reminder from '../models/Reminder.js';
import User from '../models/User.js';
import CircadianProfile from '../models/CircadianProfile.js';
import NotificationLog from '../models/NotificationLog.js';
import { generateMedicationSchedule, timeToMinutes, minutesToTime } from './medicationScheduler.js';

const DEFAULT_PROFILE = {
  wakeTime: '07:00',
  sleepTime: '23:00',
  breakfastTime: '08:00',
  lunchTime: '13:00',
  dinnerTime: '20:00',
  chronotype: 'intermediate',
  timezone: 'UTC',
};

const format12Hour = (time24) => {
  const [h, m] = String(time24 || '00:00').split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
};

const normalizePhoneToChatId = (phone) => {
  const configured = process.env.GREEN_API_CHAT_ID;
  const caregiver = process.env.CAREGIVER_WHATSAPP_NUMBER;
  const countryCode = String(process.env.GREEN_API_DEFAULT_COUNTRY_CODE || '91');
  if (configured) {
    const trimmed = String(configured).trim();

    // Configured chat id is authoritative; keep known suffix formats unchanged.
    if (trimmed.endsWith('@c.us') || trimmed.endsWith('@g.us') || trimmed.endsWith('@lid')) {
      return trimmed;
    }

    // If only digits are configured, fallback to default-country normalization.
    const localDigits = String(trimmed).replace(/\D/g, '');
    if (!localDigits) return null;
    const withCountry = localDigits.length === 10 ? `${countryCode}${localDigits}` : localDigits;
    return `${withCountry}@c.us`;
  }

  if (caregiver) {
    const caregiverDigits = String(caregiver).replace(/\D/g, '');
    if (caregiverDigits.length >= 10) {
      const withCountry = caregiverDigits.length === 10 ? `${countryCode}${caregiverDigits}` : caregiverDigits;
      return `${withCountry}@c.us`;
    }
  }

  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;

  const withCountry = digits.length === 10 ? `${countryCode}${digits}` : digits;
  return `${withCountry}@c.us`;
};

const getProfileForUser = async (userId, userDoc) => {
  const saved = await CircadianProfile.findOne({ userId: String(userId) }).lean();
  if (saved) return saved;

  return {
    ...DEFAULT_PROFILE,
    wakeTime: userDoc?.sleepSchedule?.wakeTime || DEFAULT_PROFILE.wakeTime,
    sleepTime: userDoc?.sleepSchedule?.sleepTime || DEFAULT_PROFILE.sleepTime,
  };
};

export const buildMedicationTimelineForUser = async (userId, now = new Date()) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    return { timeline: [], user: null, whatsappConfigured: false };
  }

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const medications = await Medication.find({
    userId,
    status: { $ne: 'inactive' },
    $and: [
      {
        $or: [
          { prescribedDate: { $exists: false } },
          { prescribedDate: null },
          { prescribedDate: { $lte: endOfDay } },
        ],
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: startOfDay } },
        ],
      },
    ],
  }).lean();
  if (!medications.length) {
    return { timeline: [], user, whatsappConfigured: Boolean(normalizePhoneToChatId(user.phone)) };
  }

  const profile = await getProfileForUser(userId, user);
  const scheduleResult = generateMedicationSchedule(medications, profile, []);
  const recommended = scheduleResult?.recommendedSchedule || [];

  const sentLogs = await NotificationLog.find({
    userId,
    type: 'reminder',
    channel: 'whatsapp',
    sentAt: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['sent', 'delivered'] },
  })
    .select('title')
    .lean();

  const completedReminders = await Reminder.find({
    userId,
    status: 'active',
    isCompleted: true,
    lastTakenAt: { $gte: startOfDay, $lte: endOfDay },
  })
    .select('medicationId time')
    .populate('medicationId', 'name')
    .lean();

  const sentTitles = new Set(sentLogs.map((log) => log.title));
  const completedByMedicationCount = new Map();
  for (const r of completedReminders) {
    const medKey = String(r.medicationId?._id || r.medicationId || '');
    completedByMedicationCount.set(medKey, (completedByMedicationCount.get(medKey) || 0) + 1);
  }
  const completedTitles = new Set(
    completedReminders.map((r) => `WhatsApp reminder: ${String(r.medicationId?.name || '').trim()} at ${String(r.time || '').trim()}`)
  );
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const timeline = recommended
    .map((dose) => {
      const medication = medications.find(
        (m) => String(m.name || '').toLowerCase() === String(dose.drugName || '').toLowerCase()
      );

      const medicationTime = String(dose.recommendedTime || '08:00');
      const medicationMin = timeToMinutes(medicationTime);
      const reminderMin = (medicationMin - 30 + 24 * 60) % (24 * 60);
      const reminderTime = minutesToTime(reminderMin);
      const title = `WhatsApp reminder: ${dose.drugName} at ${medicationTime}`;
      const medicationKey = String(medication?._id || '');
      const remainingCompletedForMedication = completedByMedicationCount.get(medicationKey) || 0;
      const canConsumeCompletedDose = remainingCompletedForMedication > 0;

      let status = 'pending';
      if (canConsumeCompletedDose || completedTitles.has(title)) {
        status = 'taken';
        if (canConsumeCompletedDose) {
          completedByMedicationCount.set(medicationKey, remainingCompletedForMedication - 1);
        }
      } else if (sentTitles.has(title)) {
        status = 'sent';
      } else if (nowMinutes >= reminderMin) {
        status = 'due';
      }

      // After medication time passes without completion, keep it as pending (overdue pending).
      if (status !== 'taken' && nowMinutes >= medicationMin) {
        status = 'pending';
      }

      return {
        medicationId: medication?._id,
        medicationName: dose.drugName,
        dosage: dose.dosage,
        frequency: dose.frequency,
        medicationTime,
        reminderTime,
        displayMedicationTime: format12Hour(medicationTime),
        displayReminderTime: format12Hour(reminderTime),
        type: '30-min WhatsApp reminder',
        channel: 'whatsapp',
        status,
        title,
        message: `Reminder: Take ${dose.drugName} ${dose.dosage || ''} at ${format12Hour(medicationTime)}.`,
      };
    })
    .sort((a, b) => timeToMinutes(a.reminderTime) - timeToMinutes(b.reminderTime));

  return {
    timeline,
    user,
    whatsappConfigured: Boolean(normalizePhoneToChatId(user.phone)),
  };
};

export const sendWhatsAppMessage = async (chatId, message) => {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;

  if (!instanceId || !token) {
    return { ok: false, reason: 'GREEN_API_INSTANCE_ID or GREEN_API_TOKEN is missing' };
  }

  const response = await fetch(
    `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, reason: payload?.message || 'Green API request failed', payload };
  }

  return { ok: true, payload };
};

export const sendDueWhatsAppRemindersForUser = async (userId, now = new Date(), options = {}) => {
  const { force = false, resendSent = false } = options;
  const { timeline, user, whatsappConfigured } = await buildMedicationTimelineForUser(userId, now);
  if (!user) {
    return { sentCount: 0, skippedCount: 0, details: [{ reason: 'User not found' }] };
  }

  const chatId = normalizePhoneToChatId(user.phone);
  if (!chatId || !whatsappConfigured) {
    return {
      sentCount: 0,
      skippedCount: timeline.length,
      details: [{ reason: 'WhatsApp target not configured. Set user.phone or GREEN_API_CHAT_ID.' }],
    };
  }

  const dueCount = timeline.filter((item) => item.status === 'due').length;
  const pendingCount = timeline.filter((item) => item.status === 'pending').length;
  const missedCount = timeline.filter((item) => item.status === 'missed').length;
  const alreadySentCount = timeline.filter((item) => item.status === 'sent').length;

  const dueItems = force
    ? (resendSent ? timeline : timeline.filter((item) => item.status !== 'sent'))
    : timeline.filter((item) => item.status === 'due');

  let sentCount = 0;
  let skippedCount = 0;
  const details = [];

  for (const item of dueItems) {
    const sendResult = await sendWhatsAppMessage(chatId, item.message);

    const log = new NotificationLog({
      userId,
      medicationId: item.medicationId,
      type: 'reminder',
      channel: 'whatsapp',
      title: item.title,
      message: item.message,
      status: sendResult.ok ? 'sent' : 'failed',
      isDelivered: Boolean(sendResult.ok),
      deliveredAt: sendResult.ok ? new Date() : undefined,
    });
    await log.save();

    if (sendResult.ok) {
      sentCount += 1;
      details.push({ medication: item.medicationName, reminderTime: item.reminderTime, status: 'sent' });
    } else {
      skippedCount += 1;
      details.push({
        medication: item.medicationName,
        reminderTime: item.reminderTime,
        status: 'failed',
        reason: sendResult.reason,
      });
    }
  }

  if (dueItems.length === 0) {
    details.push({
      reason: force
        ? 'No unsent reminders available to force-send.'
        : 'No reminders are currently in 30-minute pre-dose due window.',
      timelineSummary: { dueCount, pendingCount, missedCount, alreadySentCount },
    });
  }

  return {
    sentCount,
    skippedCount,
    dueCount,
    pendingCount,
    missedCount,
    alreadySentCount,
    force,
    resendSent,
    resolvedChatId: chatId,
    details,
  };
};

export const sendMissedReminderAlertForUser = async (userId, now = new Date(), options = {}) => {
  const { threshold = 3 } = options;
  const { timeline, user, whatsappConfigured } = await buildMedicationTimelineForUser(userId, now);

  if (!user) {
    return { alerted: false, reason: 'User not found', missedCount: 0 };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const pendingItems = timeline.filter((item) => {
    if (item.status !== 'pending') return false;
    const [hh, mm] = String(item.medicationTime || '00:00').split(':').map(Number);
    const medicationMin = (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
    return nowMinutes >= medicationMin;
  });
  const pendingCount = pendingItems.length;

  if (pendingCount < threshold) {
    return {
      alerted: false,
      reason: `Pending threshold not reached (${pendingCount}/${threshold})`,
      pendingCount,
    };
  }

  const chatId = normalizePhoneToChatId(user.phone);
  if (!chatId || !whatsappConfigured) {
    return {
      alerted: false,
      reason: 'WhatsApp target not configured. Set user.phone or GREEN_API_CHAT_ID.',
      pendingCount,
    };
  }

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAlert = await NotificationLog.findOne({
    userId,
    type: 'alert',
    channel: 'whatsapp',
    sentAt: { $gte: startOfDay, $lte: endOfDay },
    title: { $regex: '^Missed reminder alert:' },
    status: { $in: ['sent', 'delivered'] },
  })
    .select('_id')
    .lean();

  if (existingAlert) {
    return {
      alerted: false,
      reason: 'Pending reminder alert already sent today',
      pendingCount,
    };
  }

  const preview = pendingItems
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.medicationName} (${item.displayMedicationTime})`)
    .join('\n');

  const message = [
    'MediClock Alert',
    `You have ${pendingCount} pending medication reminder${pendingCount === 1 ? '' : 's'} past due today.`,
    '',
    'Pending doses:',
    preview || 'No missed dose details available.',
    '',
    'Please review your reminders and take only as medically appropriate.',
  ].join('\n');

  const title = `Pending reminder alert: ${pendingCount} pending dose${pendingCount === 1 ? '' : 's'}`;
  const sendResult = await sendWhatsAppMessage(chatId, message);

  const log = new NotificationLog({
    userId,
    type: 'alert',
    channel: 'whatsapp',
    title,
    message,
    status: sendResult.ok ? 'sent' : 'failed',
    isDelivered: Boolean(sendResult.ok),
    deliveredAt: sendResult.ok ? new Date() : undefined,
  });
  await log.save();

  return {
    alerted: Boolean(sendResult.ok),
    pendingCount,
    title,
    reason: sendResult.ok ? 'Pending reminder alert sent' : sendResult.reason,
  };
};

export const sendDueWhatsAppRemindersForAllUsers = async () => {
  const userIds = await Medication.distinct('userId', { status: { $ne: 'inactive' } });
  let sentCount = 0;
  let skippedCount = 0;
  let missedAlertCount = 0;
  let missedAlertSkippedCount = 0;

  for (const userId of userIds) {
    const result = await sendDueWhatsAppRemindersForUser(userId, new Date());
    sentCount += result.sentCount;
    skippedCount += result.skippedCount;

    const missedAlertResult = await sendMissedReminderAlertForUser(userId, new Date(), { threshold: 3 });
    if (missedAlertResult.alerted) {
      missedAlertCount += 1;
    } else {
      missedAlertSkippedCount += 1;
    }
  }

  return {
    sentCount,
    skippedCount,
    usersProcessed: userIds.length,
    missedAlertCount,
    missedAlertSkippedCount,
  };
};
