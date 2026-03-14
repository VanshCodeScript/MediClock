import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

export const generateToken = async (req, res) => {
  try {
    const { identity, room } = req.body;

    if (!identity) {
      return res.status(400).json({ error: 'identity is required' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;

    if (!accountSid || !apiKey || !apiSecret) {
      return res.status(500).json({
        error: 'Twilio Video credentials missing. Add TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET.',
      });
    }

    const roomName = room || `consultation_${identity}_${Date.now()}`;
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity });
    token.addGrant(new VideoGrant({ room: roomName }));

    res.json({
      token: token.toJwt(),
      room: roomName,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};