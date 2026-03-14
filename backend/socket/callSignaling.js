import mongoose from "mongoose";
import Call from "../models/Call.js";

const userRoom = (userId) => `user:${userId}`;
const buildRoomName = (callerId) => `consultation_${callerId}_${Date.now()}`;

const connectedUsers = new Map();

const normalizeUserId = (value) => String(value || "").trim();

const addConnectedSocket = (userId, socketId) => {
  if (!userId || !socketId) return;

  const next = connectedUsers.get(userId) || new Set();
  next.add(socketId);
  connectedUsers.set(userId, next);
};

const removeConnectedSocket = (userId, socketId) => {
  if (!userId || !socketId) return;

  const existing = connectedUsers.get(userId);
  if (!existing) return;

  existing.delete(socketId);

  if (existing.size === 0) {
    connectedUsers.delete(userId);
    return;
  }

  connectedUsers.set(userId, existing);
};

const computeDurationSeconds = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) return 0;

  return Math.max(
    0,
    Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
  );
};

export const registerCallSignaling = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("user:register", async ({ userId }) => {
      const normalizedUserId = normalizeUserId(userId);
      if (!normalizedUserId) return;

      socket.data.userId = normalizedUserId;

      addConnectedSocket(normalizedUserId, socket.id);

      socket.join(userRoom(normalizedUserId));

      socket.emit("user:registered", { userId: normalizedUserId });

      try {
        const pendingCall = await Call.findOne({
          calleeId: normalizedUserId,
          status: "ringing",
        }).sort({ createdAt: -1 });

        if (pendingCall) {
          socket.emit("call:incoming", {
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
      } catch {}
    });

    socket.on("call:initiate", async (payload, ack) => {
      try {
        const {
          callerId,
          callerName,
          callerRole = "patient",
          calleeId,
          calleeRole = "doctor",
        } = payload || {};

        const normalizedCallerId = normalizeUserId(callerId);
        const normalizedCalleeId = normalizeUserId(calleeId);

        if (!normalizedCallerId || !normalizedCalleeId || !callerName) {
          ack?.({
            ok: false,
            error: "callerId, callerName and calleeId are required",
          });
          return;
        }

        if (
          !mongoose.isValidObjectId(normalizedCallerId) ||
          !mongoose.isValidObjectId(normalizedCalleeId)
        ) {
          ack?.({
            ok: false,
            error: "callerId and calleeId must be valid MongoDB ObjectIds",
          });
          return;
        }

        const roomName = buildRoomName(normalizedCallerId);

        const calleeRoom = io.sockets.adapter.rooms.get(
          userRoom(normalizedCalleeId)
        );

        const calleeOnlineByRoom = !!calleeRoom && calleeRoom.size > 0;
        const calleeOnlineByMap =
          (connectedUsers.get(normalizedCalleeId)?.size || 0) > 0;

        const calleeOnline = calleeOnlineByRoom || calleeOnlineByMap;

        if (!calleeOnline) {
          ack?.({
            ok: false,
            error:
              "The target user is offline or not on the video page. Ask them to open Video Call first.",
          });
          return;
        }

        const call = await Call.create({
          callerId: normalizedCallerId,
          callerName,
          callerRole,
          calleeId: normalizedCalleeId,
          calleeRole,
          roomName,
          status: "ringing",
        });

        const eventPayload = {
          callId: String(call._id),
          callerId: normalizedCallerId,
          callerName,
          callerRole,
          calleeId: normalizedCalleeId,
          calleeRole,
          roomName,
          status: call.status,
        };

        io.to(userRoom(normalizedCalleeId)).emit(
          "call:incoming",
          eventPayload
        );

        io.to(userRoom(normalizedCallerId)).emit(
          "call:ringing",
          eventPayload
        );

        ack?.({ ok: true, call: eventPayload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("call:accept", async ({ callId, userId }, ack) => {
      try {
        const startedAt = new Date();

        const call = await Call.findByIdAndUpdate(
          callId,
          { status: "accepted", startedAt },
          { new: true }
        );

        if (!call) {
          ack?.({ ok: false, error: "Call not found" });
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

        io.to(userRoom(String(call.callerId))).emit("call:accept", payload);
        io.to(userRoom(String(call.calleeId))).emit("call:accept", payload);

        ack?.({ ok: true, call: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("call:reject", async ({ callId, userId }, ack) => {
      try {
        const endedAt = new Date();

        const call = await Call.findByIdAndUpdate(
          callId,
          { status: "rejected", endedAt },
          { new: true }
        );

        if (!call) {
          ack?.({ ok: false, error: "Call not found" });
          return;
        }

        const payload = {
          callId: String(call._id),
          callerId: String(call.callerId),
          calleeId: String(call.calleeId),
          rejectedBy: userId,
          status: call.status,
        };

        io.to(userRoom(String(call.callerId))).emit("call:reject", payload);
        io.to(userRoom(String(call.calleeId))).emit("call:reject", payload);

        ack?.({ ok: true, call: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("call:end", async ({ callId, userId }, ack) => {
      try {
        const existingCall = await Call.findById(callId);

        if (!existingCall) {
          ack?.({ ok: false, error: "Call not found" });
          return;
        }

        const endedAt = new Date();

        existingCall.status = "ended";
        existingCall.endedAt = endedAt;
        existingCall.durationSeconds = computeDurationSeconds(
          existingCall.startedAt,
          endedAt
        );

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

        io.to(userRoom(String(existingCall.callerId))).emit("call:end", payload);
        io.to(userRoom(String(existingCall.calleeId))).emit("call:end", payload);

        ack?.({ ok: true, call: payload });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("disconnect", () => {
      const userId = normalizeUserId(socket.data?.userId);

      if (!userId) return;

      removeConnectedSocket(userId, socket.id);
    });
  });
};
