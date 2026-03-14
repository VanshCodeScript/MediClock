import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Mic, Send, Bot, User } from "lucide-react";
import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };
const initialMessages: Message[] = [
  { role: "assistant", text: "Hello! I'm your MediClock AI assistant. How can I help you today?" },
];

const VoiceAssistantPage = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setTimeout(() => {
      let reply = "Based on your circadian rhythm data, I'd recommend taking your BP medicine at 9:00 PM for optimal effectiveness.";
      if (userMsg.toLowerCase().includes("sleep")) reply = "Your sleep data shows an average of 7.2 hours. Consider shifting your evening medications 30 minutes earlier.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.role === "assistant" ? "gradient-blue" : "bg-muted"}`}>
                {m.role === "assistant" ? <Bot className="w-4 h-4 text-primary-foreground" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`glass-card p-4 max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : ""}`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card p-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setListening(!listening)}
            className={`p-3 rounded-xl transition-colors ${listening ? "gradient-blue text-primary-foreground animate-pulse-soft" : "bg-muted hover:bg-accent"}`}
          >
            <Mic className="w-5 h-5" />
          </motion.button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about your medications..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={send} className="p-3 rounded-xl gradient-blue text-primary-foreground">
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
};

export default VoiceAssistantPage;
