import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  getSuggestionsApi, 
  getRecentSearchesApi, 
  getTrendingSearchesApi, 
  clearRecentSearchesApi,
  searchProductsApi
} from '../services/api';

export default function SearchOverlay() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [trending, setTrending] = useState([]);
  const [listening, setListening] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Fetch recent and trending searches when overlay focuses
  const loadSearches = async () => {
    try {
      const trendingData = await getTrendingSearchesApi();
      setTrending(trendingData);

      if (isLoggedIn) {
        const recentData = await getRecentSearchesApi();
        setRecent(recentData);
      }
    } catch (err) {
      console.error('Failed to load searches', err);
    }
  };

  useEffect(() => {
    if (focused) {
      loadSearches();
    }
  }, [focused, isLoggedIn]);

  // Click outside to close suggestion overlay
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced auto-suggestions
  const handleQueryChange = (val) => {
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!val.trim()) {
      setSuggestions([]);
      setCorrectedQuery(null);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        setLoading(true);
        // Get typing suggestions
        const sug = await getSuggestionsApi(val);
        setSuggestions(sug);

        // Fetch did-you-mean typo correction from search endpoint
        const res = await searchProductsApi(val);
        if (res.correctedQuery && res.correctedQuery.toLowerCase() !== val.toLowerCase()) {
          setCorrectedQuery(res.correctedQuery);
        } else {
          setCorrectedQuery(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleSearchSubmit = (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setFocused(false);
    navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
  };

  const clearRecent = async (e, singleQuery = null) => {
    e.stopPropagation();
    try {
      await clearRecentSearchesApi(singleQuery);
      if (singleQuery) {
        setRecent(prev => prev.filter(r => r !== singleQuery));
      } else {
        setRecent([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Web Speech API Voice Search
  const triggerVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      handleSearchSubmit(transcript);
    };

    recognition.start();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg" id="search-container">
      {/* ── Search Input Box ── */}
      <div className={`relative flex items-center h-10 sm:h-11 rounded-2xl bg-stone-50 border-2 transition-all duration-300 overflow-hidden ${
        focused ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/10' : 'border-stone-100 hover:border-stone-200'
      }`}>
        <span className="pl-3.5 text-stone-400 text-sm flex-shrink-0">🔍</span>
        
        <input 
          type="text" 
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
          placeholder="Search products, benefits, ayurveda..." 
          className="w-full h-full pl-3 pr-20 bg-transparent text-sm text-stone-800 placeholder-stone-400 font-semibold focus:outline-none"
        />

        {/* Action icons inside input bar */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {query && (
            <button 
              onClick={() => { setQuery(''); setSuggestions([]); setCorrectedQuery(null); }} 
              className="w-7 h-7 text-stone-400 hover:text-stone-600 rounded-lg flex items-center justify-center text-xs transition-colors"
            >
              ✕
            </button>
          )}

          {/* Voice Mic Button */}
          <motion.button 
            type="button"
            onClick={triggerVoiceSearch}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={listening ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={listening ? { duration: 1.5, repeat: Infinity } : {}}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              listening ? 'bg-red-500 text-white' : 'bg-stone-200/60 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
            }`}
          >
            🎤
          </motion.button>
        </div>
      </div>



      {/* ── Dropdown Suggestions and History Overlay Card ── */}
      <AnimatePresence>
        {focused && (
          <motion.div 
            initial={{ opacity: 0, y: 12, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[48px] bg-white border border-stone-100 rounded-3xl shadow-2xl p-5 z-50 overflow-hidden space-y-4 max-h-[85vh] overflow-y-auto"
          >
            {/* Loading Indicator */}
            {loading && (
              <div className="absolute top-2 right-4 flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="block w-3.5 h-3.5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full" />
                Thinking…
              </div>
            )}

            {/* Listening Modal Banner */}
            {listening && (
              <div className="p-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl flex items-center gap-3 shadow-lg">
                <div className="relative">
                  <span className="block w-3 h-3 bg-white rounded-full animate-ping absolute inset-0" />
                  <span className="block w-3 h-3 bg-white rounded-full relative" />
                </div>
                <div>
                  <p className="font-extrabold text-sm leading-none">Listening...</p>
                  <p className="text-[10px] text-red-100 mt-1 font-semibold">Speak your health concern or product name</p>
                </div>
              </div>
            )}

            {/* Typo Spell check corrected query did-you-mean */}
            {correctedQuery && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-xs font-bold text-emerald-800">
                💡 Did you mean:{' '}
                <button 
                  type="button" 
                  onClick={() => { setQuery(correctedQuery); handleSearchSubmit(correctedQuery); }} 
                  className="underline hover:text-emerald-950 font-black cursor-pointer ml-1"
                >
                  {correctedQuery}
                </button>
              </div>
            )}

            {/* 1. Real-Time Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest pl-1">Suggestions</p>
                <div className="divide-y divide-stone-50">
                  {suggestions.map((sug, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => { setQuery(sug); handleSearchSubmit(sug); }}
                      className="w-full text-left py-2.5 px-2 hover:bg-stone-50 text-stone-700 hover:text-emerald-700 text-sm font-bold transition-all rounded-xl flex items-center gap-2"
                    >
                      <span className="text-stone-300 text-xs">🔍</span>
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Recent Searches (chips) */}
            {isLoggedIn && recent.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Recent Searches</p>
                  <button 
                    type="button" 
                    onClick={(e) => clearRecent(e)} 
                    className="text-[10px] text-stone-400 hover:text-red-500 font-bold transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((recSearch, i) => (
                    <div 
                      key={i}
                      onClick={() => { setQuery(recSearch); handleSearchSubmit(recSearch); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border border-stone-200/60 hover:border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer select-none"
                    >
                      <span>{recSearch}</span>
                      <button 
                        type="button" 
                        onClick={(e) => clearRecent(e, recSearch)}
                        className="hover:text-red-500 pl-0.5 text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Trending Now searches (chips) */}
            {trending.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest pl-1">Trending Now</p>
                <div className="flex flex-wrap gap-1.5">
                  {trending.map((trendSearch, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => { setQuery(trendSearch); handleSearchSubmit(trendSearch); }}
                      className="px-3.5 py-1.5 bg-green-50/50 hover:bg-green-100 text-green-700 border border-green-100 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🔥</span>
                      {trendSearch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. AI recommendations quick intent mapping */}
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50 rounded-2xl">
              <p className="text-[10px] font-extrabold text-green-800 flex items-center gap-1">
                <span>🤖</span> AI Recommendations
              </p>
              <p className="text-[10px] text-stone-500 mt-1 leading-relaxed font-semibold">
                Try searching <span className="font-extrabold text-emerald-700">"energy booster"</span>, <span className="font-extrabold text-emerald-700">"stress relief"</span> or <span className="font-extrabold text-emerald-700">"digestion"</span> to trigger intelligent synonym matches!
              </p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
