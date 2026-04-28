"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Bot, User, Activity } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  intent?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: "Hello! I am Aura, your Adobe Creative Cloud assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Assuming FastAPI is running on port 8000
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, session_id: sessionId })
      });
      
      const data = await res.json();
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: data.response,
        intent: data.intent 
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = { id: Date.now().toString(), role: "ai", content: "Sorry, I am having trouble connecting to the server. Please ensure the FastAPI backend is running." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-darkBg text-white">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="rounded-full p-2 transition-colors hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neonBlue to-neonPurple shadow-[0_0_15px_rgba(0,240,255,0.5)]">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight">Aura Assistant</h1>
              <div className="flex items-center gap-1.5 text-xs text-neonBlue">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neonBlue opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-neonBlue"></span>
                </span>
                Agent Active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${msg.role === "user" ? "bg-white/20" : "bg-neonPurple/20"}`}>
                      {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-neonPurple" />}
                    </div>
                    <span className="text-xs text-gray-400">{msg.role === "user" ? "You" : "Aura"}</span>
                    {msg.intent && (
                      <span className="flex items-center gap-1 rounded border border-neonBlue/30 bg-neonBlue/10 px-1.5 py-0.5 text-[10px] text-neonBlue">
                        <Activity className="h-3 w-3" /> {msg.intent}
                      </span>
                    )}
                  </div>
                  
                  <div className={`glass-panel rounded-2xl px-5 py-3.5 text-sm sm:text-base leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-neonBlue/20 to-neonPurple/20 border-white/20 rounded-tr-sm" 
                      : "bg-white/5 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neonPurple/20">
                    <Bot className="h-3 w-3 text-neonPurple" />
                  </div>
                  <div className="glass-panel flex gap-1 rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neonBlue" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neonBlue" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neonBlue" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-darkBg/80 p-4 backdrop-blur-xl sm:p-6">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about Creative Cloud pricing, tools, or sign up..."
              className="glass-panel w-full rounded-full bg-white/5 py-4 pl-6 pr-14 outline-none focus:border-neonBlue/50 focus:ring-1 focus:ring-neonBlue/50 transition-all placeholder:text-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-neonBlue to-neonPurple text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
          <div className="mt-3 text-center text-xs text-gray-500">
            Aura can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
}
