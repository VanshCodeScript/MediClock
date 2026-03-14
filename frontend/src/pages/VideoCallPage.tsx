import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { ClipboardPlus, Mic, MicOff, MessageSquare, Phone, PhoneOff, Pill, SendHorizontal, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import TwilioVideo from "twilio-video";
import { api } from "@/lib/api";
import { useLocation } from "react-router-dom";

const resolveSocketBase = () => {
  const envSocketBase = import.meta.env.VITE_SOCKET_BASE_URL;
  if (envSocketBase) {
    return String(envSocketBase).replace(/\/$/, "");
  }

  const envApiBase = import.meta.env.VITE_API_BASE_URL;
  if (envApiBase) {
    return String(envApiBase).replace(/\/api(?:\/v1)?\/?$/, "").replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:5001`;
  }

  return "http://localhost:5001";
};

const API_BASE = resolveSocketBase();

type StoredUser = {
  _id: string;
  name: string;
  role?: string;
};

type UserOption = {
  _id: string;
  name: string;
  role?: string;
};

type CallPayload = {
  callId: string;
  callerId: string;
  callerName?: string;
  callerRole?: string;
  calleeId: string;
  calleeRole?: string;
  roomName: string;
  status?: string;
};

type ChatMessage = {
  id: string;
  callId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type PrescriptionEntry = {
  medicine: string;
  dosage: string;
  instructions: string;
};

const VideoCallPage = () => {
  const location = useLocation();
  const socketRef = useRef<Socket | null>(null);
  const roomRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [calleeId, setCalleeId] = useState("");
  const [calleeName, setCalleeName] = useState("");
  const [incomingCall, setIncomingCall] = useState<CallPayload | null>(null);
  const [activeCall, setActiveCall] = useState<CallPayload | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "incoming" | "connecting" | "connected">("idle");
  const [statusMessage, setStatusMessage] = useState("Ready for consultation");
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketRegisteredUserId, setSocketRegisteredUserId] = useState("");
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [prescriptionDraft, setPrescriptionDraft] = useState<PrescriptionEntry>({ medicine: "", dosage: "", instructions: "" });
  const [sessionPrescriptions, setSessionPrescriptions] = useState<Record<string, PrescriptionEntry[]>>({});
  const [error, setError] = useState("");
  const [remoteParticipantName, setRemoteParticipantName] = useState("Waiting for participant");

  const isDoctor = currentUser?.role === "doctor";
  const counterpartyRole = currentUser?.role === "doctor" ? "patient" : "doctor";

  const clearMediaContainer = (container: HTMLDivElement | null) => {
    if (!container) {
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  };

  const attachTrack = (track: any, container: HTMLDivElement | null) => {
    if (!container || !track) {
      return;
    }

    const element = track.attach();
    if (track.kind === "video") {
      element.className = "w-full h-full object-cover rounded-2xl";
    } else {
      element.style.display = "none";
    }
    container.appendChild(element);
  };

  const detachTrack = (track: any) => {
    if (!track) {
      return;
    }

    track.detach().forEach((element: Element) => element.remove());
  };

  const attachParticipant = (participant: any) => {
    setRemoteParticipantName(participant.identity || "Participant");

    participant.tracks.forEach((publication: any) => {
      if (publication.track) {
        attachTrack(publication.track, remoteVideoRef.current);
      }
    });

    participant.on("trackSubscribed", (track: any) => {
      attachTrack(track, remoteVideoRef.current);
    });

    participant.on("trackUnsubscribed", (track: any) => {
      detachTrack(track);
    });
  };

  const cleanupRoom = () => {
    if (roomRef.current) {
      roomRef.current.localParticipant.tracks.forEach((publication: any) => {
        publication.track?.stop?.();
        detachTrack(publication.track);
      });
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    clearMediaContainer(localVideoRef.current);
    clearMediaContainer(remoteVideoRef.current);
    setRemoteParticipantName("Waiting for participant");
    setIsMuted(false);
    setIsCameraOff(false);
  };

  const joinTwilioRoom = async (roomName: string, callId: string) => {
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    if (roomRef.current?.name === roomName) {
      return;
    }

    cleanupRoom();
    setCallStatus("connecting");
    setStatusMessage(`Connecting to room ${roomName}...`);

    const identity = `${currentUser.role || "patient"}_${currentUser._id}`;
    const tokenResponse = await api.video.generateToken({ identity, room: roomName });
    if (!tokenResponse?.token) {
      throw new Error(tokenResponse?.error || "Failed to generate Twilio token");
    }

    const room = await TwilioVideo.connect(tokenResponse.token, {
      name: tokenResponse.room,
      audio: true,
      video: { width: 640, height: 480 },
    });

    roomRef.current = room;
    clearMediaContainer(localVideoRef.current);
    clearMediaContainer(remoteVideoRef.current);

    room.localParticipant.tracks.forEach((publication: any) => {
      if (publication.track) {
        attachTrack(publication.track, localVideoRef.current);
      }
    });

    room.participants.forEach((participant: any) => attachParticipant(participant));
    room.on("participantConnected", (participant: any) => attachParticipant(participant));
    room.on("participantDisconnected", (participant: any) => {
      participant.tracks.forEach((publication: any) => detachTrack(publication.track));
      clearMediaContainer(remoteVideoRef.current);
      setRemoteParticipantName("Waiting for participant");
    });
    room.on("disconnected", () => {
      cleanupRoom();
    });

    setActiveCall((prev) => ({ ...(prev || {}), callId, roomName, callerId: prev?.callerId || currentUser._id, calleeId: prev?.calleeId || calleeId } as CallPayload));
    setCallStatus("connected");
    setStatusMessage(`Connected to ${remoteParticipantName || counterpartyRole}`);
  };

  useEffect(() => {
    const rawUser = localStorage.getItem("mediclock_user");
    if (!rawUser) {
      setError("Please log in before using video consultation.");
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as StoredUser;
      setCurrentUser(parsed);
    } catch {
      setError("Unable to resolve current user. Please log in again.");
      return;
    }
  }, []);

  useEffect(() => {
    if (!currentUser?._id) {
      return;
    }

    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("user:register", { userId: currentUser._id });
    });

    socket.on("user:registered", ({ userId }: { userId: string }) => {
      setSocketRegisteredUserId(userId || "");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      setSocketRegisteredUserId("");
    });

    socket.on("call:incoming", (payload: CallPayload) => {
      setIncomingCall(payload);
      setCallStatus("incoming");
      setStatusMessage(`${payload.callerName || "A user"} is calling...`);
    });

    socket.on("call:ringing", (payload: CallPayload) => {
      setActiveCall(payload);
      setCallStatus("ringing");
      setStatusMessage("Ringing the other participant...");
    });

    socket.on("call:accept", async (payload: CallPayload) => {
      setIncomingCall(null);
      setActiveCall(payload);
      try {
        await joinTwilioRoom(payload.roomName, payload.callId);
      } catch (joinError: any) {
        setError(joinError?.message || "Failed to join Twilio room");
      }
    });

    socket.on("call:reject", () => {
      cleanupRoom();
      setIncomingCall(null);
      setActiveCall(null);
      setCallStatus("idle");
      setStatusMessage("Call was rejected");
    });

    socket.on("call:end", () => {
      cleanupRoom();
      setIncomingCall(null);
      setActiveCall(null);
      setCallStatus("idle");
      setStatusMessage("Call ended");
    });

    socket.on("call:chat", (message: ChatMessage) => {
      if (!message?.callId || !message?.id) {
        return;
      }

      setChatMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return () => {
      cleanupRoom();
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?._id) {
      return;
    }

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await api.users.getAll();
        if (!Array.isArray(users)) {
          return;
        }

        const filtered = users
          .filter((u) => u?._id && u._id !== currentUser._id)
          .filter((u) => {
            if (!u?.role) {
              return true;
            }
            // Keep exact role match when role exists; otherwise keep for flexibility in demo data.
            return u.role === counterpartyRole;
          })
          .map((u) => ({ _id: String(u._id), name: String(u.name || "Unknown"), role: u.role }));

        setAvailableUsers(filtered);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [currentUser?._id, counterpartyRole]);

  useEffect(() => {
    const state = location.state as { calleeId?: string; calleeName?: string } | null;
    if (!state) {
      return;
    }

    if (state.calleeId) {
      setCalleeId(state.calleeId);
    }

    if (state.calleeName) {
      setCalleeName(state.calleeName);
    }
  }, [location.state]);

  const initiateCall = () => {
    if (!socketRef.current || !currentUser?._id) {
      setError("Socket not ready. Refresh and try again.");
      return;
    }

    if (!calleeId.trim()) {
      setError(`Enter a valid ${counterpartyRole} user ID to start the consultation.`);
      return;
    }

    setError("");
    socketRef.current.emit(
      "call:initiate",
      {
        callerId: currentUser._id,
        callerName: currentUser.name,
        callerRole: currentUser.role === "doctor" ? "doctor" : "patient",
        calleeId: calleeId.trim(),
        calleeRole: counterpartyRole,
      },
      (response: any) => {
        if (!response?.ok) {
          setError(response?.error || "Failed to initiate call");
          return;
        }

        setActiveCall(response.call);
        setCallStatus("ringing");
        setStatusMessage("Call initiated. Waiting for acceptance...");
      }
    );
  };

  const acceptCall = () => {
    if (!incomingCall || !socketRef.current || !currentUser?._id) {
      return;
    }

    setError("");
    socketRef.current.emit(
      "call:accept",
      { callId: incomingCall.callId, userId: currentUser._id },
      (response: any) => {
        if (!response?.ok) {
          setError(response?.error || "Failed to accept call");
        }
      }
    );
  };

  const rejectCall = () => {
    if (!incomingCall || !socketRef.current || !currentUser?._id) {
      return;
    }

    socketRef.current.emit("call:reject", { callId: incomingCall.callId, userId: currentUser._id });
    setIncomingCall(null);
    setCallStatus("idle");
    setStatusMessage("Call rejected");
  };

  const endCall = () => {
    if (activeCall?.callId && socketRef.current && currentUser?._id) {
      socketRef.current.emit("call:end", { callId: activeCall.callId, userId: currentUser._id });
    }

    cleanupRoom();
    setIncomingCall(null);
    setActiveCall(null);
    setCallStatus("idle");
    setStatusMessage("Call ended");
  };

  const toggleMute = () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    room.localParticipant.audioTracks.forEach((publication: any) => {
      if (isMuted) {
        publication.track?.enable();
      } else {
        publication.track?.disable();
      }
    });
    setIsMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    const room = roomRef.current;
    if (!room) {
      return;
    }

    room.localParticipant.videoTracks.forEach((publication: any) => {
      if (isCameraOff) {
        publication.track?.enable();
      } else {
        publication.track?.disable();
      }
    });
    setIsCameraOff((prev) => !prev);
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text || !activeCall?.callId || !socketRef.current || !currentUser?._id) {
      return;
    }

    setError("");
    socketRef.current.emit(
      "call:chat",
      {
        callId: activeCall.callId,
        senderId: currentUser._id,
        senderName: currentUser.name,
        text,
      },
      (response: { ok: boolean; message?: ChatMessage; error?: string }) => {
        if (!response?.ok || !response.message) {
          setError(response?.error || "Unable to send chat message");
          return;
        }

        setChatMessages((prev) => [...prev, response.message as ChatMessage]);
        setChatInput("");
      }
    );
  };

  const addPrescriptionEntry = () => {
    if (!activeCall?.callId) {
      setError("Start or accept a call before adding prescription.");
      return;
    }

    if (!prescriptionDraft.medicine.trim() || !prescriptionDraft.dosage.trim()) {
      setError("Medicine and dosage are required.");
      return;
    }

    setSessionPrescriptions((prev) => {
      const existing = prev[activeCall.callId] || [];
      return {
        ...prev,
        [activeCall.callId]: [
          ...existing,
          {
            medicine: prescriptionDraft.medicine.trim(),
            dosage: prescriptionDraft.dosage.trim(),
            instructions: prescriptionDraft.instructions.trim(),
          },
        ],
      };
    });

    setPrescriptionDraft({ medicine: "", dosage: "", instructions: "" });
  };

  const participantLabel = incomingCall?.callerName || calleeName || `Assigned ${counterpartyRole}`;
  const isCallActive = callStatus === "connecting" || callStatus === "connected";
  const activeCallPrescriptions = activeCall?.callId ? sessionPrescriptions[activeCall.callId] || [] : [];
  const activeChatMessages = activeCall?.callId
    ? chatMessages.filter((message) => message.callId === activeCall.callId)
    : [];

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">
        {error && (
          <div className="glass-card p-4 border-l-4 border-red-400 bg-red-50/50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display font-bold text-xl">Doctor–Patient Video Consultation</h2>
            <p className="text-sm text-muted-foreground">
              Socket status: {socketConnected ? "connected" : "disconnected"} · {statusMessage}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{currentUser?.name || "Unknown user"}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-xs">
          <p className="text-muted-foreground">
            You: <span className="font-mono text-foreground">{currentUser?._id || "-"}</span>
            {" · "}
            Socket Registered As: <span className="font-mono text-foreground">{socketRegisteredUserId || "not-registered"}</span>
            {" · "}
            Target: <span className="font-mono text-foreground">{calleeId || "not-set"}</span>
          </p>
        </motion.div>

        {callStatus === "idle" || callStatus === "ringing" ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center space-y-5">
            <Video className="w-10 h-10 text-primary mx-auto" />
            <div>
              <h3 className="font-display font-bold text-xl mb-2">Start a Consultation</h3>
              <p className="text-sm text-muted-foreground">
                Invite a {counterpartyRole} into the same Twilio consultation room.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div>
                <label className="text-sm font-medium mb-1.5 block capitalize">{counterpartyRole} User ID</label>
                <input
                  value={calleeId}
                  onChange={(e) => setCalleeId(e.target.value)}
                  placeholder={`Paste ${counterpartyRole} MongoDB user id`}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block capitalize">{counterpartyRole} Name</label>
                <input
                  value={calleeName}
                  onChange={(e) => setCalleeName(e.target.value)}
                  placeholder={`Optional ${counterpartyRole} display name`}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block capitalize">
                  Pick {counterpartyRole} From Registered Users
                </label>
                <select
                  value={calleeId}
                  onChange={(e) => {
                    const selected = availableUsers.find((u) => u._id === e.target.value);
                    setCalleeId(e.target.value);
                    if (selected) {
                      setCalleeName(selected.name);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">{loadingUsers ? "Loading users..." : `Select ${counterpartyRole}`}</option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role || "user"}) - {u._id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={initiateCall}
              disabled={callStatus === "ringing"}
              className="px-8 py-3 gradient-blue text-primary-foreground rounded-xl font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Phone className="w-4 h-4" /> {callStatus === "ringing" ? "Ringing…" : "Start Video Call"}
            </motion.button>
          </motion.div>
        ) : null}

        {incomingCall && callStatus === "incoming" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display font-semibold text-lg">Incoming Consultation</h3>
              <p className="text-sm text-muted-foreground">
                {incomingCall.callerName || "A participant"} is calling from room {incomingCall.roomName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={rejectCall} className="px-4 py-2 rounded-xl bg-muted text-sm font-medium hover:bg-accent transition-colors">
                Reject
              </button>
              <button onClick={acceptCall} className="px-4 py-2 rounded-xl gradient-blue text-primary-foreground text-sm font-medium">
                Accept
              </button>
            </div>
          </motion.div>
        )}

        {(callStatus === "connecting" || callStatus === "connected") && (
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card aspect-video grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 bg-foreground/5 overflow-hidden">
              <div className="relative rounded-2xl overflow-hidden bg-card min-h-[320px]">
                <div ref={remoteVideoRef} className="w-full h-full flex items-center justify-center" />
                {!remoteVideoRef.current?.children.length && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full gradient-blue flex items-center justify-center text-primary-foreground text-2xl font-bold mb-3">
                      {participantLabel.slice(0, 2).toUpperCase() || "DR"}
                    </div>
                    <p className="font-medium">{participantLabel}</p>
                    <p className="text-sm text-muted-foreground">{callStatus === "connecting" ? "Joining room…" : remoteParticipantName}</p>
                  </div>
                )}
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-card min-h-[220px]">
                <div ref={localVideoRef} className="w-full h-full flex items-center justify-center" />
                {!localVideoRef.current?.children.length && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Local preview not ready
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
                  You
                </div>
              </div>
            </motion.div>

            <div className="flex items-center justify-center gap-4">
              <motion.button whileTap={{ scale: 0.92 }} onClick={toggleMute} className="p-4 rounded-full bg-muted text-foreground hover:bg-accent transition-colors">
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.92 }} onClick={toggleCamera} className="p-4 rounded-full bg-muted text-foreground hover:bg-accent transition-colors">
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.92 }} onClick={endCall} className="p-4 rounded-full bg-destructive text-destructive-foreground">
                <PhoneOff className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${isDoctor ? "xl:grid-cols-[1.2fr_1fr]" : "xl:grid-cols-1"} gap-6`}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Dynamic Chat</h3>
            <div className="space-y-2 mb-3 max-h-44 overflow-y-auto scrollbar-hide text-xs">
              {!isCallActive && (
                <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                  Chat becomes active when consultation is connected.
                </div>
              )}
              {isCallActive && activeChatMessages.length === 0 && (
                <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                  No messages yet for this call.
                </div>
              )}
              {activeChatMessages.map((message) => (
                <div key={message.id} className={`p-3 rounded-lg ${message.senderId === currentUser?._id ? "bg-accent" : "bg-muted"}`}>
                  <p className="font-medium text-foreground">{message.senderName}</p>
                  <p className="text-muted-foreground">{message.text}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message"
                disabled={!isCallActive}
                className="w-full px-3 py-2 rounded-lg bg-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
              />
              <button
                onClick={sendChatMessage}
                disabled={!isCallActive || !chatInput.trim()}
                className="px-3 py-2 rounded-lg gradient-blue text-primary-foreground text-xs font-medium inline-flex items-center gap-1 disabled:opacity-70"
              >
                <SendHorizontal className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </motion.div>

          {isDoctor && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><ClipboardPlus className="w-4 h-4 text-primary" /> Prescription</h3>
              <p className="text-xs text-muted-foreground mb-3">Session: {activeCall?.callId || "No active consultation"}</p>

              <div className="space-y-2 mb-3">
                <input
                  value={prescriptionDraft.medicine}
                  onChange={(e) => setPrescriptionDraft((prev) => ({ ...prev, medicine: e.target.value }))}
                  placeholder="Medicine"
                  disabled={!isCallActive}
                  className="w-full px-3 py-2 rounded-lg bg-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                />
                <input
                  value={prescriptionDraft.dosage}
                  onChange={(e) => setPrescriptionDraft((prev) => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Dosage"
                  disabled={!isCallActive}
                  className="w-full px-3 py-2 rounded-lg bg-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                />
                <textarea
                  value={prescriptionDraft.instructions}
                  onChange={(e) => setPrescriptionDraft((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions"
                  disabled={!isCallActive}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-muted text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 resize-none"
                />
                <button
                  onClick={addPrescriptionEntry}
                  disabled={!isCallActive}
                  className="w-full px-3 py-2 rounded-lg gradient-blue text-primary-foreground text-xs font-medium disabled:opacity-70"
                >
                  Add Prescription
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {activeCallPrescriptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No prescription entries added for this call.</p>
                ) : (
                  activeCallPrescriptions.map((entry, index) => (
                    <div key={`${entry.medicine}-${index}`} className="p-3 rounded-lg bg-muted text-xs">
                      <p className="font-medium text-foreground inline-flex items-center gap-1"><Pill className="w-3 h-3" /> {entry.medicine}</p>
                      <p className="text-muted-foreground">Dosage: {entry.dosage}</p>
                      <p className="text-muted-foreground">Instructions: {entry.instructions || "-"}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default VideoCallPage;
