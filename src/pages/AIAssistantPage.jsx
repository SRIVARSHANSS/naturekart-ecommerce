import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api';
import { matchSymptoms } from '../utils/symptomMatcher';
import Navbar from '../components/Navbar';

const HISTORY_KEY = 'naturekart_ai_history';

const GOAL_CARDS = [
  { icon: '😤', label: 'Reduce Stress',      category: 'stress',    query: 'I feel stressed and anxious, please help' },
  { icon: '😴', label: 'Better Sleep',        category: 'sleep',     query: 'I have trouble sleeping at night' },
  { icon: '🛡️', label: 'Boost Immunity',     category: 'immunity',  query: 'I want to boost my immunity naturally' },
  { icon: '⚖️', label: 'Weight Management',  category: 'weight',    query: 'I need help with weight management' },
  { icon: '✨', label: 'Skin & Hair Care',   category: 'skincare',  query: 'I want healthy glowing skin and hair' },
  { icon: '⚡', label: 'More Energy',         category: 'energy',    query: 'I feel fatigued and need more energy' },
  { icon: '🌿', label: 'Better Digestion',   category: 'digestion', query: 'I have digestive issues and bloating' },
  { icon: '💚', label: 'Overall Wellness',   category: 'general',   query: 'I want general health and wellness support' },
];

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-2 px-1">
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        className="w-2.5 h-2.5 bg-gold-light rounded-full"
      />
    ))}
  </div>
);

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { addToCart } = useCart();

  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState('general');
  const [addedIds, setAddedIds] = useState({});
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const autoSentRef = useRef(false);

  /* Load database products on mount */
  useEffect(() => {
    getProducts()
      .then(data => {
        setDbProducts(data || []);
      })
      .catch(err => {
        console.error("Error loading products from database:", err);
      });
  }, []);

  /* Load history from localStorage */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (saved.length > 0) {
        setMessages(saved);
        // Extract category & products from last assistant message
        const lastAssistant = [...saved].reverse().find(m => m.role === 'assistant');
        if (lastAssistant) {
          setCategory(lastAssistant.category || 'general');
        }
      }
    } catch (_) {}
  }, []);

  /* Save history on messages change */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    }
  }, [messages]);

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* Auto-send if ?category param exists */
  useEffect(() => {
    const cat = params.get('category');
    if (cat && !autoSentRef.current && dbProducts.length > 0) {
      autoSentRef.current = true;
      const card = GOAL_CARDS.find(c => c.category === cat);
      if (card) {
        setTimeout(() => sendMessage(card.query), 600);
      }
    }
  }, [params, dbProducts]); // eslint-disable-line

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMsg = {
      role: 'user',
      content: msg,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setProducts([]);

    // Simulate natural thinking delay for premium feel
    setTimeout(() => {
      const data = matchSymptoms(msg, dbProducts);
      
      const aiMsg = {
        role: 'assistant',
        content: data.message,
        id: Date.now() + 1,
        category: data.category,
        timestamp: new Date().toISOString(),
        followUps: data.followUpSuggestions || [],
        matchedProducts: data.products || []
      };

      setMessages(prev => [...prev, aiMsg]);
      setProducts(data.products || []);
      setCategory(data.category || 'general');
      setIsLoading(false);
    }, 1200);
  }, [input, dbProducts, isLoading]);

  // Update products panel when messages are loaded/changed
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant && lastAssistant.matchedProducts) {
      setProducts(lastAssistant.matchedProducts);
    }
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setProducts([]);
    setCategory('general');
    localStorage.removeItem(HISTORY_KEY);
  };

  const exportChat = () => {
    const text = messages.map(m => `[${m.role === 'user' ? 'You' : 'NatureBot'}]: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'naturekart-advisor-chat.txt';
    a.click();
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedIds(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAddedIds(prev => {
      const n = { ...prev };
      delete n[product._id];
      return n;
    }), 2000);
  };

  const getBadgeColor = (cat) => {
    const colors = {
      stress: 'bg-gold-light/20 text-gold border-gold-light/35',
      sleep: 'bg-gold-light/20 text-gold border-gold-light/35',
      immunity: 'bg-gold-light/20 text-gold border-gold-light/35',
      weight: 'bg-gold-light/20 text-gold border-gold-light/35',
      skincare: 'bg-gold-light/20 text-gold border-gold-light/35',
      energy: 'bg-gold-light/20 text-gold border-gold-light/35',
      digestion: 'bg-gold-light/20 text-gold border-gold-light/35',
      general: 'bg-gold/10 text-gold border-gold/20'
    };
    return colors[cat] || colors.general;
  };

  return (
    <div className="min-h-screen bg-bg text-gold font-sans antialiased">
      <Navbar />

      {/* ── Header / Hero ── */}
      <div className="relative border-b border-gold/10 bg-surface overflow-hidden pt-28 pb-14">
        {/* Leaf Background Accents */}
        {['🌿', '🍃', '🌱', '✨', '🍃'].map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-15 pointer-events-none select-none"
            style={{ left: `${8 + i * 22}%`, top: `${20 + (i % 3) * 20}%` }}
            animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.4 }}
          >
            {emoji}
          </motion.div>
        ))}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-gold-dim text-xs tracking-[0.25em] uppercase font-sans mb-3 italic">
            — Pure Ayurvedic Guidance
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gold tracking-tight leading-none mb-3">
            Botanical Advisor
          </h1>
          <p className="text-gold-light text-sm max-w-xl mx-auto font-sans leading-relaxed">
            Tell us how you are feeling or what you want to improve. Our symptom engine will instantly match you with perfect natural remedies.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      {/* ── Quick Goal Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-xs font-bold text-gold-dim uppercase tracking-[0.15em] mb-5 text-center">
          Select a wellness goal to begin
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {GOAL_CARDS.map((card) => (
            <motion.button
              key={card.category}
              whileHover={{ y: -4, borderColor: 'rgba(27, 54, 38, 0.6)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => sendMessage(card.query)}
              className="bg-surface/50 border border-gold/15 p-4 flex flex-col items-center gap-3 transition-all cursor-pointer relative"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/35" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold/35" />
              
              <div className="w-12 h-12 rounded-sm bg-surface flex items-center justify-center text-2xl border border-gold/10">
                {card.icon}
              </div>
              <span className="text-xs font-serif font-bold text-gold text-center leading-tight">
                {card.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Chat Container ── */}
          <div className="flex-1 bg-surface/40 border border-gold/15 flex flex-col relative" style={{ minHeight: 520 }}>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/45" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold/45" />

            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gold/15 flex items-center justify-between bg-surface/75">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌿</span>
                <div>
                  <h3 className="font-serif font-bold text-base text-gold leading-tight">NatureBot</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-gold-light rounded-full animate-pulse" />
                    <span className="text-[11px] text-gold-dim font-sans uppercase tracking-wider">Ayurvedic Matching Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportChat}
                  className="text-xs text-gold hover:text-gold-light transition-all font-semibold uppercase tracking-wider border-r border-gold/20 pr-3"
                >
                  Export
                </button>
                <button
                  onClick={clearChat}
                  className="text-xs text-gold hover:text-gold-light transition-all font-semibold uppercase tracking-wider"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[440px] bg-surface/20">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <span className="text-4xl block mb-3 opacity-60">🌿</span>
                  <h4 className="font-serif font-bold text-lg text-gold mb-1">Welcome to NatureBot</h4>
                  <p className="text-gold-dim text-xs max-w-xs mx-auto leading-relaxed">
                    Describe your physical or mental health concern in detail. We'll search our curated collection for matching herbs.
                  </p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative px-4 py-3 max-w-[85%] border shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gold text-bg border-gold'
                          : 'bg-surface border-gold/20 text-gold'
                      }`}
                    >
                      {/* Message corner accents */}
                      {msg.role !== 'user' && (
                        <>
                          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold/30" />
                        </>
                      )}
                      
                      <p className="text-sm font-sans leading-relaxed whitespace-pre-line">{msg.content}</p>
                      
                      <div className={`mt-2 flex items-center justify-between gap-4 border-t ${
                        msg.role === 'user' ? 'border-bg/15 text-bg/60' : 'border-gold/10 text-gold-dim'
                      } pt-1.5 text-[10px]`}>
                        {msg.role === 'assistant' && msg.category && (
                          <span className={`font-semibold uppercase tracking-wider border px-2 py-0.5 ${getBadgeColor(msg.category)}`}>
                            {msg.category}
                          </span>
                        )}
                        <span>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {/* Follow up suggestions */}
                      {msg.role === 'assistant' && msg.followUps?.length > 0 && (
                        <div className="mt-3.5 flex flex-col gap-2 border-t border-gold/10 pt-3">
                          <p className="text-[10px] text-gold-dim font-bold uppercase tracking-wider">Suggested queries:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map(f => (
                              <button
                                key={f}
                                onClick={() => sendMessage(f)}
                                className="text-[11px] font-sans font-medium bg-surface-light border border-gold/20 text-gold hover:border-gold hover:bg-surface px-2.5 py-1 rounded-[1px] transition-all text-left"
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-gold/25 px-4 py-3 relative">
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-gold/30" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-gold/30" />
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gold/15 bg-surface/65 flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Describe your health goal or symptoms (e.g., cold and cough, sleep help)..."
                className="flex-1 p-3 text-sm border border-gold/20 focus:border-gold bg-bg text-gold placeholder-gold-dim/40 focus:outline-none focus:ring-0 transition-all font-sans resize-none"
              />
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-gold text-bg hover:bg-gold-light disabled:opacity-40 transition-all flex items-center justify-center shadow-lg shadow-gold/10 shimmer-btn-glow font-bold"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
                  </svg>
                </button>
                <span className="text-[9px] text-gold-dim font-bold tracking-wider">{input.length}/500</span>
              </div>
            </div>
          </div>

          {/* ── Product Recommendations Panel ── */}
          <div className="lg:w-[380px] flex flex-col">
            <div className="bg-surface/40 border border-gold/15 relative flex flex-col flex-1" style={{ minHeight: 400 }}>
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/45" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold/45" />

              {/* Title Header */}
              <div className="px-5 py-4 border-b border-gold/15 bg-surface/75 flex items-center justify-between">
                <h4 className="font-serif font-bold text-sm text-gold tracking-wide uppercase">
                  🌿 Curated Matches
                </h4>
                {category !== 'general' && (
                  <span className={`text-[10px] font-bold border px-2 py-0.5 tracking-wider uppercase ${getBadgeColor(category)}`}>
                    {category}
                  </span>
                )}
              </div>

              {/* Recommendations Content */}
              {products.length === 0 && !isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface/10">
                  <span className="text-4xl mb-3 opacity-30">🌱</span>
                  <h5 className="font-serif font-bold text-sm text-gold mb-1">Awaiting Consultation</h5>
                  <p className="text-gold-dim text-xs leading-relaxed max-w-[200px] mx-auto">
                    Products matching your specific condition will be curated here dynamically.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto bg-surface/10">
                  {/* Skeletons while typing */}
                  {isLoading && products.length === 0 && [1, 2].map(i => (
                    <div key={i} className="animate-pulse border border-gold/15 bg-surface/50 p-4 relative flex gap-3">
                      <div className="w-16 h-16 bg-gold/10 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gold/10 w-3/4" />
                        <div className="h-3 bg-gold/10 w-1/2" />
                        <div className="h-3 bg-gold/10 w-1/3" />
                      </div>
                    </div>
                  ))}

                  <AnimatePresence>
                    {!isLoading && products.map((product, i) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-surface/85 border border-gold/15 p-3 flex gap-3 relative hover:border-gold/30 transition-all group"
                      >
                        {/* Card corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/35" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/35" />

                        {/* Image wrapper */}
                        <div className="w-16 h-16 bg-bg flex-shrink-0 relative overflow-hidden border border-gold/10">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span className="absolute bottom-0.5 right-0.5 text-sm bg-surface/80 px-0.5">{product.icon || '🌿'}</span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h5 className="font-serif font-bold text-xs text-gold leading-tight line-clamp-1 group-hover:text-gold-light transition-colors">
                              {product.name}
                            </h5>
                            <p className="text-gold font-bold text-xs font-sans mt-0.5">
                              ₹{Number(product.price).toLocaleString()}
                            </p>
                            <p className="text-gold-dim text-[11px] font-serif italic line-clamp-2 mt-1 leading-snug">
                              {product.aiReason || product.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gold/10">
                            <button
                              onClick={() => navigate(`/product/${product._id}`)}
                              className="text-[10px] font-sans font-bold uppercase tracking-wider text-gold hover:text-gold-light border border-gold/25 px-2 py-1 hover:bg-gold/5 transition-all"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleAddToCart(product)}
                              className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-1 transition-all ${
                                addedIds[product._id]
                                  ? 'bg-gold text-bg'
                                  : 'bg-gold text-bg hover:bg-gold-light shimmer-btn-glow'
                              }`}
                            >
                              {addedIds[product._id] ? '✓ Added' : '+ Bag'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Guidance Disclaimer ── */}
      <div className="bg-surface/30 border-t border-gold/15 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold-dim text-xs font-bold uppercase tracking-widest mb-3">
            Important Information
          </p>
          <p className="text-gold-light text-xs font-sans leading-relaxed italic max-w-2xl mx-auto">
            Disclaimer: The health advice and recommendations given by NatureBot are based on general Ayurvedic wellness principles and are intended for educational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment. Please consult with a healthcare professional before starting any herbal supplements.
          </p>
        </div>
      </div>
    </div>
  );
}
