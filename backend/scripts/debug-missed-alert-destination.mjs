import "dotenv/config";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import NotificationLog from "../models/NotificationLog.js";

const userId = process.argv[2] || "69b50ef61994aafed483ce46";

await connectDB();

const user = await User.findById(userId).select("name phone").lean();
const logs = await NotificationLog.find({ userId, type: "alert", channel: "whatsapp" })
  .sort({ sentAt: -1 })
  .limit(5)
  .lean();

console.log(
  JSON.stringify(
    {
      env: {
        GREEN_API_CHAT_ID: process.env.GREEN_API_CHAT_ID || null,
        CAREGIVER_WHATSAPP_NUMBER: process.env.CAREGIVER_WHATSAPP_NUMBER || null,
      },
      user: {
        _id: user?._id || null,
        name: user?.name || null,
        phone: user?.phone || null,
      },
      recentAlertLogs: logs.map((l) => ({
        title: l.title,
        status: l.status,
        isDelivered: l.isDelivered,
        sentAt: l.sentAt,
      })),
    },
    null,
    2
  )
);

process.exit(0);
