"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatResponse } from "@/actions/chat";
import ReactMarkdown from "react-markdown";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm **SAMPAT AI**, your personal financial concierge. I have access to your real account data, transactions, and budgets. Ask me anything — from spending insights to personalized saving strategies. 💡",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Pass conversation history for context (excluding the new user message)
      const history = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const result = await getChatResponse(input, history);
      const aiText = result?.success
        ? result.response
        : `⚠️ **AI Error**\n\n${result?.error || "Unknown error occurred."}`;
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **AI Temporarily Unavailable**\n\n${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Spending summary",
    "Budget status",
    "Saving tips",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        /* --- Floating Button --- */
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-100"
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
          }}
          aria-label="Open SAMPAT AI"
          suppressHydrationWarning
        >
          <MessageCircle className="h-7 w-7 text-white" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-indigo-500" />
          {/* Online indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
          </span>
        </button>
      ) : (
        /* --- Chat Panel --- */
        <div
          className="w-[400px] h-[600px] flex flex-col rounded-3xl overflow-hidden"
          style={{
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(99,102,241,0.15)",
            animation: "fadeInUp 0.3s ease",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{
              background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-base tracking-tight flex items-center gap-1.5">
                  SAMPAT AI
                  <Zap size={12} className="text-amber-300 fill-amber-300" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-200 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              suppressHydrationWarning
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ background: "#f8f9ff" }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                {m.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-1 shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #4338ca, #6d28d9)",
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-white text-slate-700 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100"
                      : "text-white rounded-2xl rounded-tr-sm"
                  }`}
                  style={
                    m.role === "user"
                      ? {
                          background:
                            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        }
                      : {}
                  }
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center mr-2 mt-1 shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #4338ca, #6d28d9)",
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: "-0.3s" }}
                    />
                    <span
                      className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"
                      style={{ animationDelay: "-0.15s" }}
                    />
                    <span className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Analyzing your data...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div
              className="px-4 py-3 border-t flex gap-2 overflow-x-auto shrink-0"
              style={{ background: "#f8f9ff" }}
            >
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setInput(p);
                  }}
                  className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white border border-indigo-100 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm shrink-0"
                  suppressHydrationWarning
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-3 bg-white border-t border-slate-100/80 shrink-0">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all"
            >
              <Input
                placeholder="Ask about your finances..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 h-9 shadow-none text-sm text-slate-700 font-medium placeholder:text-slate-400"
                disabled={isLoading}
                suppressHydrationWarning
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-9 w-9 shrink-0 rounded-xl text-white transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                }}
                suppressHydrationWarning
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
