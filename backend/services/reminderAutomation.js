import { sendDueWhatsAppRemindersForAllUsers } from './reminderService.js';

let automationTimer = null;

export const startReminderAutomation = () => {
  if (automationTimer) {
    return;
  }

  const run = async () => {
    try {
      const result = await sendDueWhatsAppRemindersForAllUsers();
      if (result.sentCount > 0 || result.skippedCount > 0) {
        console.log(
          `[ReminderAutomation] users=${result.usersProcessed}, sent=${result.sentCount}, skipped=${result.skippedCount}`
        );
      }
    } catch (error) {
      console.error('[ReminderAutomation] Error:', error.message);
    }
  };

  // Run once at startup, then every minute.
  run();
  automationTimer = setInterval(run, 60 * 1000);
};
