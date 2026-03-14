import "dotenv/config";

const instanceId = process.env.GREEN_API_INSTANCE_ID;
const token = process.env.GREEN_API_TOKEN;
const digits = String(process.env.CAREGIVER_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const chatId = digits ? `${digits}@c.us` : "";

if (!instanceId || !token || !chatId) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: "Missing Green API creds or caregiver number",
        instanceId: Boolean(instanceId),
        token: Boolean(token),
        chatId,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chatId,
    message: `MediClock direct delivery test at ${new Date().toLocaleString("en-IN")}`,
  }),
});

const payload = await response.json().catch(() => ({}));

console.log(
  JSON.stringify(
    {
      sendOk: response.ok,
      httpStatus: response.status,
      chatId,
      idMessage: payload?.idMessage || null,
      payload,
    },
    null,
    2
  )
);

process.exit(0);
