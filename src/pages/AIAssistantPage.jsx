import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { chatWithNatureBot } from '../services/api';
import { useCart } from '../context/CartContext';

const HISTORY_KEY = 'naturekart_ai_history';

const GOAL_CARDS = [
  { icon: '😤', label: 'Reduce Stress',      category: 'stress',    query: 'I feel stressed and anxious, please help' },
  { icon: '😴', label: 'Better Sleep',        category: 'sleep',     query: 'I have trouble sleeping at night' },
  { icon: '🛡️', label: 'Boost Immunity',     category: 'immunity',  query: 'I want to boost my immunity naturally' },
  { icon: '⚖️', label: 'Weight Management',  category: 'weight',    query: 'I need help with weight management' },
  { icon: '✨', label: 'Skin Glow',           category: 'skincare',  query: 'I want glowing healthy skin naturally' },
  { icon: '⚡', label: 'More Energy',         category: 'energy',    query: 'I feel fatigued and need more energy' },
  { icon: '🌿', label: 'Better Digestion',   category: 'digestion', query: 'I have digestive issues and bloating' },
  { icon: '💚', label: 'Overall Wellness',   category: 'general',   query: 'I want general health and wellness support' },
];

const TypingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0,1,2].map(i => (
      <motion.div key={i} animate={{ y: [0,-5,0] }}
        transition={{ duration:0.5, repeat:Infinity, delay:i*0.12, ease:'easeInOut' }}
        className="w-2 h-2 bg-emerald-400 rounded-full" />
    ))}
  </div>
);

export default function AIAssistantPage() {
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const { addToCart } = useCart();

  const [messages,   setMessages]   = useState([]);
  const [products,   setProducts]   = useState([]);
  const [input,      setInput]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const [category,   setCategory]   = useState('general');
  const [addedIds,   setAddedIds]   = useState({});
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);
  const autoSentRef = useRef(false);

  /* Load history from localStorage */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (saved.length > 0) setMessages(saved);
    } catch (_) {}
  }, []);

  /* Save history on messages change */
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    }
  }, [messages]);

  /* Auto-send if ?category param exists */
  useEffect(() => {
    const cat = params.get('category');
    if (cat && !autoSentRef.current) {
      autoSentRef.current = true;
      const card = GOAL_CARDS.find(c => c.category === cat);
      if (card) setTimeout(() => sendMessage(card.query), 600);
    }
  }, [params]); // eslint-disable-line

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, id: Date.now(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setProducts([]);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const data = await chatWithNatureBot(msg, history);

      const aiMsg = {
        role: 'assistant', content: data.message, id: Date.now() + 1,
        category: data.category, timestamp: new Date().toISOString(),
        followUps: data.followUpSuggestions || [],
      };
      setMessages(prev => [...prev, aiMsg]);
      setProducts(data.products || []);
      setCategory(data.category || 'general');
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant', id: Date.now() + 1, timestamp: new Date().toISOString(),
          content: 'NatureBot is resting 🌿 Please try again in a moment.',
          category: 'general', followUps: [],
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([]); setProducts([]); setCategory('general');
    localStorage.removeItem(HISTORY_KEY);
  };

  const exportChat = () => {
    const text = messages.map(m => `[${m.role === 'user' ? 'You' : 'NatureBot'}]: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'naturekart-chat.txt'; a.click();
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedIds(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAddedIds(prev => { const n = {...prev}; delete n[product._id]; return n; }), 1500);
  };

  const catColor = { stress:'purple', sleep:'indigo', immunity:'green', weight:'orange', skincare:'pink', energy:'yellow', digestion:'teal', general:'emerald' };
  const getBadge = (cat) => {
    const colors = { stress:'bg-purple-100 text-purple-700', sleep:'bg-indigo-100 text-indigo-700', immunity:'bg-green-100 text-green-700', weight:'bg-orange-100 text-orange-700', skincare:'bg-pink-100 text-pink-700', energy:'bg-yellow-100 text-yellow-800', digestion:'bg-teal-100 text-teal-700', general:'bg-emerald-100 text-emerald-700' };
    return colors[cat] || colors.general;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-stone-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <span className="text-white">🌿</span>
            </div>
            <span className="text-lg font-bold text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {[['/','/','Home'],[ '/shop','/shop','Shop'],['/about','/about','About'],['/contact','/contact','Contact']].map(([path,,label]) => (
              <button key={path} onClick={() => navigate(path)} className="px-3 py-1.5 text-sm font-semibold rounded-xl text-stone-600 hover:text-green-700 hover:bg-green-50 transition-all">{label}</button>
            ))}
            <span className="ml-1 px-3 py-1.5 text-sm font-bold rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm">🤖 AI Assistant</span>
          </div>
          <button onClick={() => navigate('/shop')} className="px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-50 rounded-xl transition-all">🛍️ Shop</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 min-h-[38vh] flex items-center justify-center overflow-hidden">
        {/* Floating leaves background */}
        {['🌿','🍃','🌱','✨','🌿','🍃'].map((e, i) => (
          <motion.div key={i} className="absolute text-2xl opacity-20 pointer-events-none select-none"
            style={{ left: `${10 + i * 16}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.6 }}>
            {e}
          </motion.div>
        ))}
        <div className="relative z-10 text-center px-4 py-12">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type:'spring', stiffness:200, delay:0.1 }}
            className="w-20 h-20 mx-auto mb-5 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20 shadow-xl">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="text-4xl">🌿</motion.span>
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-black text-white mb-3">NatureBot — Your AI Health Companion</motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-emerald-200 text-base max-w-xl mx-auto">Describe how you're feeling. I'll understand and recommend the perfect natural products for you.</motion.p>
        </div>
      </section>

      {/* ── Quick Cards ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 text-center">Choose a health goal to get started</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {GOAL_CARDS.map((card, i) => (
            <motion.button key={card.category}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(16,185,129,0.25)' }} whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(card.query)}
              className="bg-white border border-stone-100 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm hover:border-green-300 transition-all cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center text-xl border border-green-100">{card.icon}</div>
              <span className="text-xs font-bold text-stone-700 text-center leading-tight">{card.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Main Chat + Products ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Chat Panel */}
          <div className="flex-1 lg:w-[60%] bg-white rounded-3xl border border-stone-100 shadow-lg flex flex-col overflow-hidden" style={{ minHeight: 560 }}>
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-gradient-to-r from-green-800 to-emerald-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🌿</div>
                <div>
                  <p className="text-white font-bold text-sm">NatureBot Chat</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                    <span className="text-emerald-200 text-xs">AI-powered · Ayurveda knowledge</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportChat} title="Export chat" className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-all font-semibold">⬇ Export</button>
                <button onClick={clearChat} title="Clear chat" className="text-white/70 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-all font-semibold">🗑 Clear</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-stone-50" style={{ maxHeight: 440 }}>
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <div className="text-5xl mb-3">🌿</div>
                  <p className="text-stone-500 font-medium">Hi! I'm NatureBot.</p>
                  <p className="text-stone-400 text-sm mt-1">Click a health goal above or type your concern below.</p>
                </motion.div>
              )}
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 bg-gradient-to-br from-green-700 to-emerald-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">🌿</div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user'
                      ? 'bg-green-600 text-white rounded-2xl rounded-br-sm'
                      : 'bg-white border border-stone-100 border-l-4 border-l-emerald-400 text-stone-700 rounded-2xl rounded-bl-sm shadow-sm'
                    } px-4 py-3 text-sm leading-relaxed`}>
                      <p>{msg.content}</p>
                      {msg.role === 'assistant' && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {msg.category && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getBadge(msg.category)}`}>{msg.category}</span>}
                          <span className="text-[10px] text-stone-400">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : ''}</span>
                        </div>
                      )}
                      {msg.followUps?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {msg.followUps.map(f => (
                            <button key={f} onClick={() => sendMessage(f)}
                              className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-full font-semibold hover:bg-emerald-100 transition-all">
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-700 to-emerald-500 rounded-full flex items-center justify-center text-sm flex-shrink-0">🌿</div>
                  <div className="bg-white border border-stone-100 border-l-4 border-l-emerald-400 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-stone-100 bg-white flex items-end gap-2">
              <textarea
                ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={2}
                placeholder="Tell me how you're feeling… (e.g., I feel tired and stressed)"
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-stone-50 focus:bg-white transition-all"
              />
              <div className="flex flex-col items-center gap-1 pb-1">
                <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
                  onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
                <span className="text-[10px] text-stone-400">{input.length}/500</span>
              </div>
            </div>
          </div>

          {/* Products Panel */}
          <div className="lg:w-[40%]">
            <div className="bg-white rounded-3xl border border-stone-100 shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-800 text-sm">🌿 Recommended For You</p>
                  {category !== 'general' && <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getBadge(category)}`}>{category}</span>}
                </div>
              </div>

              {products.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <span className="text-5xl mb-3">🌱</span>
                  <p className="text-stone-600 font-semibold text-sm">Chat with NatureBot</p>
                  <p className="text-stone-400 text-xs mt-1">to get personalised product picks!</p>
                </div>
              ) : (
                <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
                  {/* Skeleton while loading */}
                  {isLoading && products.length === 0 && [1,2,3].map(i => (
                    <div key={i} className="animate-pulse flex gap-3 p-3 rounded-2xl border border-stone-100">
                      <div className="w-16 h-16 bg-stone-200 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-stone-200 rounded w-3/4" />
                        <div className="h-3 bg-stone-200 rounded w-1/2" />
                        <div className="h-3 bg-stone-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                  <AnimatePresence>
                    {products.map((product, i) => (
                      <motion.div key={product._id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -3, boxShadow: '0 16px 32px rgba(16,185,129,0.18)' }}
                        className="bg-white border border-stone-100 rounded-2xl p-3 flex gap-3 shadow-sm transition-shadow cursor-default">
                        {/* Image */}
                        <div className="relative flex-shrink-0">
                          <img src={product.image} alt={product.name}
                            className="w-16 h-16 rounded-xl object-cover bg-stone-100"
                            onError={e => { e.currentTarget.style.display='none'; }} />
                          <span className="absolute -top-1 -left-1 text-base">{product.icon || '🌿'}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-800 text-sm leading-tight line-clamp-1">{product.name}</p>
                          <p className="text-emerald-600 font-extrabold text-sm mt-0.5">₹{product.price}</p>
                          <p className="text-stone-400 text-xs italic line-clamp-1 mt-0.5">{product.aiReason || product.description}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(product.rating || 4))}</span>
                            <span className="text-xs text-stone-400">({product.reviews || 0})</span>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <button onClick={() => navigate(`/product/${product._id}`)}
                              className="text-[11px] font-bold text-green-700 border border-green-300 px-2 py-1 rounded-lg hover:bg-green-50 transition-all">
                              View
                            </button>
                            <motion.button whileTap={{ scale: 0.93 }} onClick={() => handleAddToCart(product)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${addedIds[product._id] ? 'bg-emerald-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                              {addedIds[product._id] ? '✓ Added' : '+ Cart'}
                            </motion.button>
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
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-stone-800 mb-8">How NatureBot Works</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {[
              { step: '1', icon: '💬', title: 'Describe concern', desc: 'Tell NatureBot how you feel in plain language' },
              { step: '2', icon: '🤖', title: 'AI understands', desc: 'GPT-4 analyses your concern with Ayurveda knowledge' },
              { step: '3', icon: '🌿', title: 'Get matched products', desc: 'Personalised natural products recommended for you' },
            ].map((step, i) => (
              <div key={step.step} className="flex sm:flex-col items-center gap-4 sm:gap-2">
                <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.15 }}
                  className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-green-200">{step.icon}</div>
                  <p className="font-bold text-stone-800 text-sm">{step.title}</p>
                  <p className="text-stone-500 text-xs text-center max-w-[140px]">{step.desc}</p>
                </motion.div>
                {i < 2 && <div className="hidden sm:block w-12 h-0.5 bg-gradient-to-r from-green-300 to-emerald-300 mt-[-20px]" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
