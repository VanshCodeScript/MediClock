import "dotenv/config";
import { connectDB } from "../db.js";
import Medication from "../models/Medication.js";
import NotificationLog from "../models/NotificationLog.js";
import { sendMissedReminderAlertForUser } from "../services/reminderService.js";

const userId = process.argv[2] || "69b50ef61994aafed483ce46";

const now = new Date();
const startOfDay = new Date(now);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(now);
endOfDay.setHours(23, 59, 59, 999);

await connectDB();

await Medication.deleteMany({ userId, name: { $regex: "^MISSED_TEST_" } });

const meds = await Medication.insertMany([
  {
    userId,
    name: "MISSED_TEST_Aspirin_1",
    dosage: "75mg",
    frequency: "once daily",
    foodRule: "none",
    status: "active",
  },
  {
    userId,
    name: "MISSED_TEST_Aspirin_2",
    dosage: "75mg",
    frequency: "once daily",
    foodRule: "after food",
    status: "active",
  },
  {
    userId,
    name: "MISSED_TEST_Aspirin_3",
    dosage: "75mg",
    frequency: "once daily",
    foodRule: "before food",
    status: "active",
  },
]);

await NotificationLog.deleteMany({
  userId,
  type: "alert",
  channel: "whatsapp",
  sentAt: { $gte: startOfDay, $lte: endOfDay },
  title: { $regex: "^Missed reminder alert:" },
});

const forcedLateNow = new Date(now);
forcedLateNow.setHours(23, 59, 0, 0);

const result = await sendMissedReminderAlertForUser(userId, forcedLateNow, { threshold: 3 });

console.log(
  JSON.stringify(
    {
      userId,
      seededMedicationNames: meds.map((m) => m.name),
      triggerAt: forcedLateNow.toISOString(),
      alertResult: result,
    },
    null,
    2
  )
);

process.exit(0);
