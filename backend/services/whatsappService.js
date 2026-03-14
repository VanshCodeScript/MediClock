const INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
const TOKEN = process.env.GREEN_API_TOKEN;
const CAREGIVER_NUMBER = process.env.CAREGIVER_WHATSAPP_NUMBER;

/**
 * Converts a phone number like "917021640446" to WhatsApp chatId format "917021640446@c.us"
 */
const toChatId = (phone) => {
  const digits = String(phone).replace(/\D/g, '');
  return `${digits}@c.us`;
};

/**
 * Send a WhatsApp message via Green API
 * @param {string} phone  - raw phone number (e.g. "919XXXXXXXXX")
 * @param {string} message - plain text message
 */
export const sendWhatsApp = async (phone, message) => {
  if (!INSTANCE_ID || !TOKEN) {
    console.warn('⚠️  Green API credentials not set — skipping WhatsApp message');
    return null;
  }

  const url = `https://api.green-api.com/waInstance${INSTANCE_ID}/sendMessage/${TOKEN}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: toChatId(phone),
      message,
    }),
  });

  const data = await response.json();
  return data;
};

/**
 * Send medication reminder alert to caregiver/patient
 */
export const sendMedicationAlert = async ({ medicineName, dosage, times, userName = '' }) => {
  if (!CAREGIVER_NUMBER) {
    console.warn('⚠️  CAREGIVER_WHATSAPP_NUMBER not set — skipping WhatsApp alert');
    return null;
  }

  const timeList = Array.isArray(times) && times.length
    ? times.join(', ')
    : 'as scheduled';

  const message = [
    '💊 *Medication Reminder*',
    '',
    `Medicine: ${medicineName}`,
    `Dosage: ${dosage}`,
    `Time(s): ${timeList}`,
    userName ? `Patient: ${userName}` : '',
    '',
    'Please take your medication on time.',
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const result = await sendWhatsApp(CAREGIVER_NUMBER, message);
    console.log(`✅ WhatsApp alert sent for ${medicineName}:`, result?.idMessage || result);
    return result;
  } catch (err) {
    console.error(`❌ WhatsApp alert failed for ${medicineName}:`, err.message);
    return null;
  }
};
