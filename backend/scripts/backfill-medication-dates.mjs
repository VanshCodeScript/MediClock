import "dotenv/config";
import { connectDB } from "../db.js";
import Medication from "../models/Medication.js";

await connectDB();

const result = await Medication.updateMany(
  {
    $or: [{ prescribedDate: { $exists: false } }, { prescribedDate: null }],
  },
  [
    {
      $set: {
        prescribedDate: { $ifNull: ["$createdAt", new Date()] },
      },
    },
  ]
);

console.log(
  JSON.stringify(
    {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    },
    null,
    2
  )
);

process.exit(0);
