import twilio from 'twilio';

class TwilioSOSService {
  constructor() {
    this._ready = false;
    this._init();
  }

  _init() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.toPhoneNumber = process.env.CAREGIVER_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      console.warn('[TwilioSOS] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN – calls disabled.');
      return;
    }
    if (!this.fromPhoneNumber || !this.toPhoneNumber) {
      console.warn('[TwilioSOS] Missing TWILIO_PHONE_NUMBER or CAREGIVER_PHONE_NUMBER – calls disabled.');
      return;
    }

    this.twilioClient = twilio(accountSid, authToken);
    this._ready = true;
    console.log('✅ Twilio SOS service initialized');
  }

  isConfigured() {
    return this._ready;
  }

  async getCallDetails(callSid) {
    if (!this._ready || !callSid) {
      return null;
    }

    try {
      const call = await this.twilioClient.calls(callSid).fetch();
      return {
        sid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        direction: call.direction,
        duration: call.duration,
        errorCode: call.errorCode,
        errorMessage: call.errorMessage,
        startTime: call.startTime,
        endTime: call.endTime,
      };
    } catch (error) {
      return {
        sid: callSid,
        status: 'unknown',
        errorMessage: `Failed to fetch call details: ${error.message}`,
      };
    }
  }

  async triggerEmergencyCall(elderlyName = 'the patient', reason = '') {
    if (!this._ready) {
      console.warn('[TwilioSOS] Call not made – Twilio not configured.');
      return { success: false, message: 'Twilio not configured. Add TWILIO credentials to .env' };
    }

    const reasonText = reason ? ` The system detected: ${reason}.` : '';

    const twiml =
      `<Response><Say voice="alice">` +
      `Emergency alert. MediClock has detected a potential emergency from ${elderlyName}.${reasonText} ` +
      `Please check on them immediately.` +
      `</Say></Response>`;

    try {
      const call = await this.twilioClient.calls.create({
        to: this.toPhoneNumber,
        from: this.fromPhoneNumber,
        twiml,
      });

      // Give Twilio a brief moment to update call lifecycle before fetching status.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const details = await this.getCallDetails(call.sid);

      console.log(`[TwilioSOS] Emergency call initiated for ${elderlyName}. SID: ${call.sid}`);
      if (details?.errorCode || details?.status === 'failed') {
        console.warn(
          `[TwilioSOS] Call diagnostic for ${call.sid}: status=${details.status}, error=${details.errorCode || 'none'} ${details.errorMessage || ''}`
        );
      }

      return {
        success: true,
        callSid: call.sid,
        callStatus: details?.status || call.status || 'queued',
        callErrorCode: details?.errorCode || null,
        callErrorMessage: details?.errorMessage || null,
        message: `Emergency call triggered for ${elderlyName}`,
      };
    } catch (error) {
      console.error('[TwilioSOS] Call failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

export default new TwilioSOSService();
