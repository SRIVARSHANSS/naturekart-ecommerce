import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api';
import { matchSymptoms } from '../utils/symptomMatcher';

const SESSION_KEY = 'nk_naturebot_greeted';

const QUICK_CHIPS = [
  { label: '😴 Sleep Issues',  query: 'I have trouble sleeping at night' },
  { label: '😰 Stress',        query: 'I am feeling very stressed and anxious' },
  { label: '🛡️ Immunity',      query: 'I want to boost my immunity' },
  { label: '⚖️ Weight Loss',   query: 'I want help with weight management' },
];

/* ── Typing dots animation ── */
const TypingDots = () => (
  <div className="flex items-center gap-1 py-2 px-1">
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        className="w-1.5 h-1.5 bg-gold-light rounded-full"
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
  const [dbProducts, setDbProducts] = useState([]);
  
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  /* Fetch products on mount */
  useEffect(() => {
    getProducts()
      .then(data => setDbProducts(data || []))
      .catch(err => console.error("Error loading products for widget:", err));
  }, []);

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

    setTimeout(() => {
      const data = matchSymptoms(msg, dbProducts);
      setLastCat(data.category || 'general');
      setMessages(prev => [...prev, {
        role:     'assistant',
        content:  data.message,
        category: data.category,
        id:       Date.now() + 1,
      }]);
      setIsTyping(false);
    }, 1000);
  }, [input, dbProducts]);

  const handleChip = (query) => sendMessage(query);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 font-sans">

      {/* ── Expanded Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="w-[340px] sm:w-[380px] h-[480px] bg-surface border border-gold/20 flex flex-col overflow-hidden relative shadow-2xl shadow-gold/10"
          >
            {/* Panel Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/40" />

            {/* Header */}
            <div className="bg-surface border-b border-gold/15 px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-sm bg-gold flex items-center justify-center text-lg">🌿</div>
              <div className="flex-1">
                <p className="text-gold font-serif font-bold text-sm leading-tight">NatureBot</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gold-light rounded-full animate-pulse" />
                  <span className="text-[10px] text-gold-dim font-bold uppercase tracking-wider">Ayurvedic Assistant</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { handleClose(); navigate('/ai-assistant'); }}
                  className="text-gold hover:text-gold-light text-xs font-bold uppercase tracking-wider transition-colors px-2 py-1 border border-gold/20 hover:border-gold/40"
                >
                  Full ↗
                </button>
                <button onClick={handleClose}
                  className="w-7 h-7 hover:bg-gold/10 flex items-center justify-center text-gold transition-all font-bold">
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-bg/25">
              {/* Quick chips — shown only when few messages */}
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {QUICK_CHIPS.map(chip => (
                    <motion.button key={chip.label}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleChip(chip.query)}
                      className="px-3 py-1.5 bg-surface border border-gold/25 text-gold text-xs font-bold rounded-[2px] shadow-sm hover:bg-surface-light hover:border-gold transition-all cursor-pointer">
                      {chip.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] relative px-3 py-2 text-sm leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-gold text-bg border-gold rounded-[2px]'
                        : 'bg-surface border-gold/20 text-gold rounded-[2px]'
                    }`}>
                      {msg.role !== 'user' && (
                        <>
                          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold/30" />
                        </>
                      )}
                      
                      <p className="font-sans text-xs sm:text-sm">{msg.content}</p>
                      
                      {msg.role === 'assistant' && msg.category && msg.category !== 'general' && (
                        <div className="mt-2 pt-2 border-t border-gold/10">
                          <button
                            onClick={() => { handleClose(); navigate(`/ai-assistant?category=${msg.category}`); }}
                            className="text-[11px] text-gold font-bold hover:text-gold-light flex items-center gap-1"
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
                  className="flex items-start">
                  <div className="bg-surface border border-gold/20 px-3 py-2 rounded-[2px] relative">
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold/30" />
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-gold/15 bg-surface/65 flex items-center gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NatureBot..."
                className="flex-1 px-3 py-2 text-sm border border-gold/20 focus:border-gold bg-bg text-gold placeholder-gold-dim/40 focus:outline-none focus:ring-0 transition-all font-sans"
              />
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 bg-gold text-bg hover:bg-gold-light rounded-[2px] flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shimmer-btn-glow font-bold"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button ── */}
      <div className="relative">
        {/* Online status indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gold border border-bg rounded-full z-10 animate-pulse" />

        {/* Pulse ring animation */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0, 0.35] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-gold -z-10"
          />
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(prev => !prev)}
          title="Ask NatureBot"
          className="w-14 h-14 rounded-full bg-gold text-bg shadow-xl shadow-gold/25 flex items-center justify-center text-2xl transition-all hover:bg-gold-light hover:shadow-2xl hover:shadow-gold/35 cursor-pointer shimmer-btn-glow"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
                className="text-bg text-xl font-bold">✕</motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}
                className="text-bg">🌿</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
