import mongoose from 'mongoose';
import Call from '../models/Call.js';

const userRoom = (userId) => `user:${userId}`;
const buildRoomName = (callerId) => `consultation_${callerId}_${Date.now()}`;

const computeDurationSeconds = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) {
    return 0;
  }

  return Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
};

export const registerCallSignaling = (io) => {
  io.on('connection', (socket) => {
    socket.on('user:register', async ({ userId }) => {
      if (!userId) {
        return;
      }

      socket.data.userId = userId;
      socket.join(userRoom(userId));
      socket.emit('user:registered', { userId });

      // If a call was initiated before this user socket became active,
      // replay the latest ringing call so the incoming modal is not missed.
      try {
        const pendingCall = await Call.findOne({
          calleeId: userId,
          status: 'ringing',
        }).sort({ createdAt: -1 });

        if (pendingCall) {
          socket.emit('call:incoming', {
            callId: String(pendingCall._id),
            callerId: String(pendingCall.callerId),
            callerName: pendingCall.callerName,
            callerRole: pendingCall.callerRole,
            calleeId: String(pendingCall.calleeId),
            calleeRole: pendingCall.calleeRole,
            roomName: pendingCall.roomName,
            status: pendingCall.status,
          });
        }
      } catch {
        // Registration should not fail due to replay lookup.
      }
    });

    socket.on('call:initiate', async (payload, ack) => {
      try {
        const {
          callerId,
          callerName,
          callerRole = 'patient',
          calleeId,
          calleeRole = 'doctor',
        } = payload || {};

        if (!callerId || !calleeId || !callerName) {
          ack?.({ ok: false, error: 'callerId, callerName and calleeId are required' });
          return;
        }

        if (!mongoose.isValidObjectId(callerId) || !mongoose.isValidObjectId(calleeId)) {
          ack?.({ ok: false, error: 'callerId and calleeId must be valid MongoDB ObjectIds' });
          return;
        }

        const roomName = buildRoomName(callerId);

        const calleeRoom = io.sockets.adapter.rooms.get(userRoom(calleeId));
        const calleeOnline = !!calleeRoom && calleeRoom.size > 0;

        if (!calleeOnline) {
          ack?.({
            ok: false,
            error: 'The target user is offline or not on the video page. Ask them to open Video Call first.',
          });
          return;
        }

        const call = await Call.create({
          callerId,
          callerName,
          callerRole,
          calleeId,
          calleeRole,
          roomName,
          status: 'ringing',
        });

        const eventPayload = {
          callId: String(call._id),
          callerId,
          callerName,
          callerRole,
          calleeId,
          calleeRole,
          roomName,
          status: call.status,
        };

        io.to(userRoom(calleeId)).emit('call:incoming', eventPayload);
        io.to(userRoom(callerId)).emit('call:ringing', eventPayload);

        ack?.({ ok: true, call: eventPayload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on('call:accept', async ({ callId, userId }, ack) => {
      try {
        const startedAt = new Date();
        const call = await Call.findByIdAndUpdate(
          callId,
          { status: 'accepted', startedAt },
          { new: true }
        );

        if (!call) {
          ack?.({ ok: false, error: 'Call not found' });
          return;
        }

        const payload = {
          callId: String(call._id),
          roomName: call.roomName,
          callerId: String(call.callerId),
          calleeId: String(call.calleeId),
          acceptedBy: userId,
          startedAt,
          status: call.status,
        };

        io.to(userRoom(String(call.callerId))).emit('call:accept', payload);
        io.to(userRoom(String(call.calleeId))).emit('call:accept', payload);

        ack?.({ ok: true, call: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on('call:reject', async ({ callId, userId }, ack) => {
      try {
        const endedAt = new Date();
        const call = await Call.findByIdAndUpdate(
          callId,
          { status: 'rejected', endedAt },
          { new: true }
        );

        if (!call) {
          ack?.({ ok: false, error: 'Call not found' });
          return;
        }

        const payload = {
          callId: String(call._id),
          callerId: String(call.callerId),
          calleeId: String(call.calleeId),
          rejectedBy: userId,
          status: call.status,
        };

        io.to(userRoom(String(call.callerId))).emit('call:reject', payload);
        io.to(userRoom(String(call.calleeId))).emit('call:reject', payload);

        ack?.({ ok: true, call: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on('call:end', async ({ callId, userId }, ack) => {
      try {
        const existingCall = await Call.findById(callId);
        if (!existingCall) {
          ack?.({ ok: false, error: 'Call not found' });
          return;
        }

        const endedAt = new Date();
        existingCall.status = 'ended';
        existingCall.endedAt = endedAt;
        existingCall.durationSeconds = computeDurationSeconds(existingCall.startedAt, endedAt);
        await existingCall.save();

        const payload = {
          callId: String(existingCall._id),
          callerId: String(existingCall.callerId),
          calleeId: String(existingCall.calleeId),
          endedBy: userId,
          endedAt,
          durationSeconds: existingCall.durationSeconds,
          status: existingCall.status,
        };

        io.to(userRoom(String(existingCall.callerId))).emit('call:end', payload);
        io.to(userRoom(String(existingCall.calleeId))).emit('call:end', payload);

        ack?.({ ok: true, call: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on('call:chat', async ({ callId, senderId, senderName, text }, ack) => {
      try {
        if (!callId || !senderId || !text) {
          ack?.({ ok: false, error: 'callId, senderId and text are required' });
          return;
        }

        const call = await Call.findById(callId);
        if (!call) {
          ack?.({ ok: false, error: 'Call not found' });
          return;
        }

        const message = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          callId: String(call._id),
          senderId: String(senderId),
          senderName: senderName || 'Participant',
          text: String(text),
          createdAt: new Date().toISOString(),
        };

        io.to(userRoom(String(call.callerId))).emit('call:chat', message);
        io.to(userRoom(String(call.calleeId))).emit('call:chat', message);

        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });
  });
};