import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { quickChatNatureBot } from '../services/api';

const SESSION_KEY = 'nk_naturebot_greeted';
const QUICK_CHIPS = [
  { label: '😴 Sleep Issues',  query: 'I have trouble sleeping at night' },
  { label: '😰 Stress',        query: 'I am feeling very stressed and anxious' },
  { label: '🛡️ Immunity',      query: 'I want to boost my immunity' },
  { label: '⚖️ Weight Loss',   query: 'I want help with weight management' },
];

/* ── Typing dots animation ── */
const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        className="w-2 h-2 bg-emerald-400 rounded-full"
      />
    ))}
  </div>
);

export default function AIFloatingWidget() {
  const navigate = useNavigate();
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [isTyping,  setIsTyping]  = useState(false);
  const [lastCat,   setLastCat]   = useState('general');
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  /* Auto-greet after 3 seconds (once per session) */
  useEffect(() => {
    const alreadyGreeted = sessionStorage.getItem(SESSION_KEY);
    if (alreadyGreeted) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setMessages([{
        role:    'assistant',
        content: "Hi! I'm NatureBot 🌿 Tell me how you're feeling today and I'll suggest the best natural products for you!",
        id:      Date.now(),
      }]);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  /* Scroll to bottom on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    /* Cancel any in-flight request */
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const data = await quickChatNatureBot(msg, history);
      setLastCat(data.category || 'general');
      setMessages(prev => [...prev, {
        role:     'assistant',
        content:  data.message,
        category: data.category,
        id:       Date.now() + 1,
      }]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role:    'assistant',
          content: 'NatureBot is resting. Please try again in a moment. 🌿',
          id:      Date.now() + 1,
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [input, messages]);

  const handleChip = (query) => sendMessage(query);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">

      {/* ── Expanded Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="w-[340px] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl shadow-green-200/60 border border-green-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-800 to-emerald-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">🌿</div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm leading-tight">NatureBot</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  <span className="text-emerald-200 text-xs">Online · AI Health Assistant</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { handleClose(); navigate('/ai-assistant'); }}
                  className="text-white/70 hover:text-white text-xs font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                >
                  Full Page ↗
                </button>
                <button onClick={handleClose}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all">
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
              {/* Quick chips — shown only when few messages */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {QUICK_CHIPS.map(chip => (
                    <motion.button key={chip.label}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handleChip(chip.query)}
                      className="px-3 py-1.5 bg-white border border-green-200 text-green-700 text-xs font-semibold rounded-full shadow-sm hover:bg-green-50 hover:border-green-400 transition-all">
                      {chip.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 bg-gradient-to-br from-green-700 to-emerald-500 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">🌿</div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-2xl rounded-br-sm'
                      : 'bg-white border border-stone-100 border-l-4 border-l-emerald-400 text-stone-700 rounded-2xl rounded-bl-sm shadow-sm'
                    } px-3 py-2 text-sm leading-relaxed`}>
                      {msg.content}
                      {msg.role === 'assistant' && msg.category && msg.category !== 'general' && (
                        <div className="mt-2 pt-2 border-t border-stone-100">
                          <button
                            onClick={() => { handleClose(); navigate(`/ai-assistant?category=${msg.category}`); }}
                            className="text-xs text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1"
                          >
                            🛍️ View {msg.category} products →
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-700 to-emerald-500 rounded-full flex items-center justify-center text-xs flex-shrink-0">🌿</div>
                  <div className="bg-white border border-stone-100 border-l-4 border-l-emerald-400 rounded-2xl rounded-bl-sm shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-stone-100 bg-white flex items-center gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How are you feeling today…"
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 bg-stone-50 focus:bg-white transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button ── */}
      <div className="relative">
        {/* Online badge */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full z-10 animate-pulse" />

        {/* Pulse ring */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-emerald-400 -z-10"
          />
        )}

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(prev => !prev)}
          title="Ask NatureBot"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-green-700 to-emerald-500 shadow-xl shadow-green-400/40 flex items-center justify-center text-2xl transition-all hover:shadow-2xl hover:shadow-green-400/60"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
                className="text-white text-xl font-bold">✕</motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}
                className="text-white">🌿</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
