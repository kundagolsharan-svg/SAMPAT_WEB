"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ChevronRight,
  TrendingUp,
  PiggyBank,
  AlertCircle,
  BarChart2,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { getChatResponse } from "@/actions/chat";

// ─── Markdown-like renderer ───────────────────────────────────────────────────
function MarkdownText({ text }) {
  const lines = text.split("\n");

  const renderInline = (str) => {
    // Bold: **text**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-white font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Inline code: `text`
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-slate-700/60 text-blue-300 px-1.5 py-0.5 rounded text-[12px] font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-black text-white mt-3 mb-1">
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // H2
    else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-base font-black text-blue-400 mt-3 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    }
    // H3
    else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-purple-400 mt-2 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    }
    // Bullet
    else if (line.match(/^[-*•] /)) {
      elements.push(
        <li key={i} className="ml-4 list-none flex items-start gap-2 text-slate-300 text-sm leading-relaxed">
          <span className="text-blue-400 mt-1 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </li>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\. /)[1];
      elements.push(
        <li key={i} className="ml-4 list-none flex items-start gap-2 text-slate-300 text-sm leading-relaxed">
          <span className="text-purple-400 font-bold shrink-0 w-5">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\. /, ""))}</span>
        </li>
      );
    }
    // Horizontal rule
    else if (line === "---" || line === "***") {
      elements.push(
        <hr key={i} className="border-slate-700/60 my-3" />
      );
    }
    // Empty line
    else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    }
    // Normal paragraph
    else {
      elements.push(
        <p key={i} className="text-slate-300 text-sm leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Suggested follow-up questions parser ────────────────────────────────────
function parseSuggestedQuestions(text) {
  const marker = "💡 You might also want to ask:";
  const idx = text.indexOf(marker);
  if (idx === -1) return { mainText: text, suggestions: [] };

  const mainText = text.slice(0, idx).trim();
  const suggestionsBlock = text.slice(idx + marker.length).trim();
  const suggestions = suggestionsBlock
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").replace(/^[-*•]\s*/, "").trim())
    .filter((l) => l.length > 10);

  return { mainText, suggestions };
}

// ─── Starter prompts ─────────────────────────────────────────────────────────
const starterPrompts = [
  {
    icon: TrendingUp,
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    iconColor: "text-blue-400",
    title: "Budget Status",
    prompt: "Show me my current budget status and spending overview",
  },
  {
    icon: PiggyBank,
    color: "from-green-500/20 to-green-600/10 border-green-500/30",
    iconColor: "text-green-400",
    title: "Save Money",
    prompt: "How can I save more money based on my spending habits?",
  },
  {
    icon: AlertCircle,
    color: "from-rose-500/20 to-rose-600/10 border-rose-500/30",
    iconColor: "text-rose-400",
    title: "Top Expenses",
    prompt: "What are my top spending categories and how can I reduce them?",
  },
  {
    icon: BarChart2,
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    iconColor: "text-purple-400",
    title: "Investment Tips",
    prompt: "Give me investment tips suitable for someone with my income level",
  },
];

// ─── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, onSuggestionClick }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const { mainText, suggestions } = isUser
    ? { mainText: msg.content, suggestions: [] }
    : parseSuggestedQuestions(msg.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} group`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isUser
            ? "bg-gradient-to-tr from-blue-500 to-purple-500"
            : "bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600"
        }`}
      >
        {isUser ? (
          <User size={15} className="text-white" />
        ) : (
          <Sparkles size={15} className="text-blue-400" />
        )}
      </div>

      {/* Bubble */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {/* Label */}
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {isUser ? "You" : "SAMPAT AI"}
        </span>

        {/* Content */}
        <div
          className={`relative rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm"
              : "bg-[#1E293B]/80 border border-slate-700/50 rounded-tl-sm backdrop-blur-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          ) : (
            <MarkdownText text={mainText} />
          )}

          {/* Copy button */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-slate-700/60"
            >
              {copied ? (
                <Check size={12} className="text-green-400" />
              ) : (
                <Copy size={12} className="text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Suggested follow-ups */}
        {suggestions.length > 0 && (
          <div className="mt-2 space-y-1.5 w-full">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={10} className="text-purple-400" />
              Suggested follow-ups
            </p>
            {suggestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onSuggestionClick(q)}
                className="w-full text-left flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/40 hover:border-blue-500/50 hover:bg-slate-700/50 rounded-xl text-xs text-slate-300 hover:text-white transition-all duration-200 group/btn"
              >
                <ChevronRight
                  size={12}
                  className="text-blue-400 shrink-0 group-hover/btn:translate-x-0.5 transition-transform"
                />
                {q}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center shrink-0">
        <Sparkles size={15} className="text-blue-400" />
      </div>
      <div className="bg-[#1E293B]/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const sendMessage = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setError(null);

    const userMsg = { role: "user", content: userMessage, id: Date.now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Pass conversation history (excluding the new user message) for context
      const historyForAI = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await getChatResponse(userMessage, historyForAI);

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.response, id: Date.now() + 1 },
        ]);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to SAMPAT AI. Please try again.");
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">SAMPAT AI Chat</h1>
            <p className="text-[11px] text-slate-400 font-semibold">
              Your personal AI financial advisor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-bold">AI Online</span>
          </div>

          {!isEmpty && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 text-xs font-semibold transition-all"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-[#0B1120]/50 border border-slate-800/60 backdrop-blur-sm">
        {isEmpty ? (
          /* Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Glow orb */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl scale-150" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                <Sparkles size={36} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">
              Hi! I&apos;m SAMPAT AI 👋
            </h2>
            <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
              I&apos;m your intelligent financial assistant. Ask me anything — about your
              budget, spending habits, saving tips, investments, or any general
              finance question.
            </p>

            {/* Starter prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {starterPrompts.map((p, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => sendMessage(p.prompt)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br ${p.color} border text-left hover:scale-[1.02] transition-all duration-200 group`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0`}>
                    <p.icon size={16} className={p.iconColor} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{p.title}</p>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {p.prompt}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-500 ml-auto shrink-0 group-hover:translate-x-1 transition-transform"
                  />
                </motion.button>
              ))}
            </div>

            <p className="mt-6 text-[11px] text-slate-600 font-semibold">
              <MessageSquare size={11} className="inline mr-1" />
              Or type your own question below
            </p>
          </div>
        ) : (
          /* Messages */
          <div className="p-4 space-y-5">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSuggestionClick={(q) => sendMessage(q)}
              />
            ))}

            <AnimatePresence>
              {isLoading && <TypingIndicator />}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"
                >
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-300 flex-1">{error}</p>
                  <button
                    onClick={() => sendMessage(messages[messages.length - 1]?.content)}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input Box ── */}
      <div className="mt-3 shrink-0">
        <div className="relative flex items-end gap-2 bg-[#1E293B]/80 border border-slate-700/60 rounded-2xl p-2 backdrop-blur-sm focus-within:border-blue-500/50 transition-all duration-200 shadow-xl shadow-black/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about your finances, budgets, investments… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500 px-2 py-1.5 resize-none leading-relaxed max-h-32 overflow-y-auto"
            disabled={isLoading}
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-blue-500/25 hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-semibold mt-2">
          SAMPAT AI uses your financial data to give personalized advice. Always verify important decisions.
        </p>
      </div>
    </div>
  );
}
