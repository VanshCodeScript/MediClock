import { useRef, useState } from 'react';
import {
  Headphones,
  Maximize2,
  Mic,
  MicOff,
  MessageSquare,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const VoiceAssistantPage = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEmbedLoaded, setIsEmbedLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const HEYGEN_EMBED_URL =
    'https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJEZXh0ZXJfRG9jdG9yX1NpdHRpbmcyX3B1YmxpYyIsInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzL2Y4M2ZmZmM0NWZhYTQzNjhiNmRiOTU5N2U2YjMyM2NhXzQ1NTkwL3ByZXZpZXdfdGFsa18zLndlYnAiLCJuZWVkUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImY0ZGQ1ZWYwYmU1OTQ5YzRiNjk1M2ZiYTIyYTllZDQyIiwidXNlcm5hbWUiOiJiNWM0MTdiZWQzN2I0ZDYzYjBjOTRiNjkwMTZiZmQ2NyJ9&inIFrame=1';

  const postToHeyGen = (action: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'streaming-embed-control',
        action,
      },
      '*',
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      postToHeyGen(next ? 'mute' : 'unmute');
      return next;
    });
  };

  const handleStartRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      postToHeyGen('start_listening');
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    postToHeyGen('stop_listening');
    setIsRecording(false);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3"
          >
            <Headphones className="text-primary" size={32} />
            Voice Assistant
          </motion.h1>
          <p className="text-muted-foreground mt-2">
            Speak naturally. The HeyGen assistant listens and responds with voice.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-3 z-50 bg-background' : 'min-h-[640px]'}`}
        >
          <div className="p-5 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg text-foreground">
                    AI Support Assistant
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground">
                      Virtual assistant - voice enabled
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleStartRecording}
                  disabled={isRecording || !isEmbedLoaded}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Start Recording"
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleStopRecording}
                  disabled={!isRecording || !isEmbedLoaded}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Stop Recording"
                >
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isEmbedLoaded}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
              <p className="text-xs text-muted-foreground">
                {isRecording ? 'Mic recording on - assistant is listening' : 'Mic idle - press Record to start voice input'}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 bg-background/50">
            <div
              className="h-full min-h-[500px] rounded-lg overflow-hidden relative border border-border"
            >
              <iframe
                ref={iframeRef}
                title="HeyGen Voice Assistant"
                src={HEYGEN_EMBED_URL}
                allow="microphone; camera; autoplay"
                onLoad={() => setIsEmbedLoaded(true)}
                className="w-full h-full min-h-[500px] border-0"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default VoiceAssistantPage;