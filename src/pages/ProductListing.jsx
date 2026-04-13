import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

// ─── Shared Utilities ──────────────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
};

const Stars = ({ rating, size = "sm" }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`${size === "sm" ? "text-xs" : "text-sm"} ${s <= Math.round(rating) ? "text-amber-400" : "text-stone-200"}`}>★</span>
    ))}
    <span className={`${size === "sm" ? "text-xs" : "text-sm"} text-stone-400 ml-1 font-medium`}>{rating}</span>
  </div>
);

// ─── All Products Data ─────────────────────────────────────────────────────────
import { ALL_PRODUCTS } from "../data/products.js";

const CATEGORIES = ["All", "Ayurveda", "Supplements", "Skincare", "Herbal Tea", "Hair Care", "Essential Oils"];
const SORT_OPTIONS = ["Relevance", "Price: Low to High", "Price: High to Low", "Top Rated", "Most Reviewed"];
const tagColors = {
  Bestseller: "bg-amber-100 text-amber-700",
  New:        "bg-blue-100 text-blue-700",
  "Top Rated":"bg-green-100 text-green-700",
  Premium:    "bg-purple-100 text-purple-700",
  Sale:       "bg-red-100 text-red-700",
};
const AI_RECS = ALL_PRODUCTS.filter((p) => [3, 1, 6, 10, 16].includes(p.id));

// ─── Shared Navbar ─────────────────────────────────────────────────────────────
const Navbar = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-green-100/40 border-b border-green-100" : "bg-white border-b border-stone-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.button onClick={() => navigate("/")} whileHover={{ scale: 1.04 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-300/40">
              <span className="text-white text-base">🌿</span>
            </div>
            <span className="text-lg font-bold text-green-800 tracking-tight">Nature<span className="text-emerald-500">Kart</span></span>
          </motion.button>

          <div className="hidden md:flex items-center gap-1">
            <motion.button onClick={() => navigate("/")} whileHover={{ scale: 1.04 }} className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-stone-600 hover:text-green-700 hover:bg-green-50">Home</motion.button>
            <motion.button onClick={() => navigate("/shop")} whileHover={{ scale: 1.04 }} className="px-4 py-2 text-sm font-semibold rounded-xl transition-all bg-green-50 text-green-700">Shop</motion.button>
            <motion.button whileHover={{ scale: 1.04 }} className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-stone-600 hover:text-green-700 hover:bg-green-50">AI Health</motion.button>
            <motion.button whileHover={{ scale: 1.04 }} className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-stone-600 hover:text-green-700 hover:bg-green-50">About</motion.button>
            <motion.button whileHover={{ scale: 1.04 }} className="px-4 py-2 text-sm font-semibold rounded-xl transition-all text-stone-600 hover:text-green-700 hover:bg-green-50">Contact</motion.button>
          </div>

          <div className="flex items-center gap-2">
            {[{ icon: "♡", label: "Wishlist" }, { icon: "👤", label: "Profile" }].map(({ icon, label }) => (
              <motion.button key={label} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50 transition-all">
                <span className="text-base">{icon}</span>
              </motion.button>
            ))}
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/cart")} className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50">
              <span className="text-base">🛒</span>
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, index = 0, onViewProduct }) => {
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!product.inStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.11)" }}
      className="relative bg-white rounded-2xl border border-stone-100 overflow-hidden group cursor-pointer flex flex-col"
    >
      {/* Tag badge */}
      {product.tag && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${tagColors[product.tag] || ""}`}>
          {product.tag}
        </div>
      )}

      {/* Out of stock overlay */}
      {!product.inStock && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
          <span className="px-3 py-1.5 bg-stone-800/80 text-white text-xs font-bold rounded-xl">Out of Stock</span>
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden" onClick={() => onViewProduct(product)}>
        <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.4 }}>
          <img src={product.image} alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
          />
          <div className="w-full h-48 hidden flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-400">
            <span className="text-4xl">{product.icon}</span>
          </div>
        </motion.div>

        {/* Wishlist */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); setWished(!wished); }}
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${wished ? "text-red-500 opacity-100" : "text-stone-400"}`}
        >
          {wished ? "♥" : "♡"}
        </motion.button>

        {/* Quick view */}
        <motion.button
          onClick={() => onViewProduct(product)}
          initial={{ opacity: 0, y: 8 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/95 text-green-700 text-xs font-bold rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap"
        >
          Quick View →
        </motion.button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase mb-1">{product.category}</span>
        <h3 onClick={() => onViewProduct(product)} className="font-bold text-stone-800 text-sm leading-tight mb-1 hover:text-green-700 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-stone-400 text-xs leading-relaxed mb-2 line-clamp-2">{product.desc}</p>
        <Stars rating={product.rating} />
        <span className="text-[10px] text-stone-400 mt-0.5">({product.reviews} reviews)</span>

        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="text-xl font-extrabold text-green-700">₹{product.price}</div>
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
            onClick={handleAddToCart}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              added
                ? "bg-green-100 text-green-700 scale-95"
                : product.inStock
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200/60"
                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            {added ? "✓ Added!" : product.inStock ? "+ Cart" : "Sold Out"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Sidebar Filter ────────────────────────────────────────────────────────────
const Sidebar = ({ selectedCat, setSelectedCat, priceRange, setPriceRange, minRating, setMinRating, inStockOnly, setInStockOnly }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.aside
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 flex-shrink-0 space-y-6"
    >
      {/* Categories */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 className="font-extrabold text-stone-800 text-sm mb-4 tracking-wide">CATEGORIES</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedCat === cat ? "bg-green-50 text-green-700 border border-green-200" : "text-stone-600 hover:text-green-700 hover:bg-stone-50"
              }`}
            >
              <span>{cat}</span>
              {selectedCat === cat && <span className="w-2 h-2 rounded-full bg-green-500" />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 className="font-extrabold text-stone-800 text-sm mb-4 tracking-wide">PRICE RANGE</h3>
        <div className="space-y-3">
          <input type="range" min={100} max={1000} step={10} value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full accent-green-500 cursor-pointer" />
          <div className="flex justify-between text-xs text-stone-500 font-semibold">
            <span>₹100</span>
            <span className="text-green-700 font-extrabold">Up to ₹{priceRange}</span>
            <span>₹1000</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 className="font-extrabold text-stone-800 text-sm mb-4 tracking-wide">MIN RATING</h3>
        <div className="space-y-2">
          {[4.5, 4, 3.5, 0].map((r) => (
            <motion.button
              key={r}
              onClick={() => setMinRating(r)}
              whileHover={{ x: 3 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                minRating === r ? "bg-amber-50 border border-amber-200" : "hover:bg-stone-50"
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${minRating === r ? "border-green-500 bg-green-500" : "border-stone-300"}`}>
                {minRating === r && <span className="text-white text-[8px]">✓</span>}
              </span>
              <span className="flex items-center gap-1 font-medium text-stone-700">
                {r > 0 ? (
                  <><span className="text-amber-400">{"★".repeat(Math.floor(r))}</span> <span className="text-xs">{r}+</span></>
                ) : "All Ratings"}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <h3 className="font-extrabold text-stone-800 text-sm mb-4 tracking-wide">AVAILABILITY</h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${inStockOnly ? "bg-green-500" : "bg-stone-200"}`}
          >
            <motion.div animate={{ x: inStockOnly ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
          <span className="text-sm font-semibold text-stone-700">In Stock Only</span>
        </label>
      </div>
    </motion.aside>
  );
};

// ─── AI Suggestion Strip ───────────────────────────────────────────────────────
const AISuggestionStrip = ({ onViewProduct }) => {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <FadeUp className="mb-10">
      <div className="bg-gradient-to-r from-green-900 via-emerald-800 to-teal-900 rounded-2xl p-6 relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-10 h-10 bg-white/15 border border-white/25 rounded-xl flex items-center justify-center text-xl">
              🤖
            </motion.div>
            <div>
              <div className="text-white font-extrabold text-sm">AI Picks For You</div>
              <div className="text-green-300 text-xs">Recommended based on your browsing interest</div>
            </div>
          </div>
          <div className="flex gap-2">
            {[-1, 1].map((dir) => (
              <motion.button key={dir} onClick={() => scroll(dir)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="w-8 h-8 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl flex items-center justify-center text-white text-sm transition-all">
                {dir === -1 ? "←" : "→"}
              </motion.button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10" style={{ scrollbarWidth: "none" }}>
          {AI_RECS.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 16px 32px rgba(0,0,0,0.25)" }}
              onClick={() => onViewProduct(product)}
              className="flex-shrink-0 w-48 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl overflow-hidden cursor-pointer group"
            >
              <div className="relative overflow-hidden h-28">
                <motion.img whileHover={{ scale: 1.08 }} transition={{ duration: 0.35 }}
                  src={product.image} alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {product.tag && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold ${tagColors[product.tag]}`}>{product.tag}</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-white text-xs font-bold leading-tight line-clamp-2 mb-1">{product.name}</p>
                <p className="text-green-300 text-xs font-extrabold">₹{product.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </FadeUp>
  );
};

// ─── TOP FILTER BAR ───────────────────────────────────────────────────────────
const TopFilterBar = ({ search, setSearch, sortBy, setSortBy, selectedCat, setSelectedCat, resultsCount }) => {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm py-3 px-4 mb-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <motion.div animate={{ boxShadow: focused ? "0 0 0 3px rgba(16,185,129,0.2)" : "none" }}
          className="relative flex-1 min-w-0 rounded-xl border border-stone-200 transition-all duration-200">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Search organic products..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-stone-800 placeholder-stone-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs">✕</button>
          )}
        </motion.div>

        {/* Category quick pills */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto">
          {CATEGORIES.slice(0, 4).map((cat) => (
            <motion.button key={cat} onClick={() => setSelectedCat(cat)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === cat ? "bg-green-500 text-white shadow-md shadow-green-200" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40 cursor-pointer flex-shrink-0">
          {SORT_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
        </select>

        <span className="text-xs text-stone-400 font-medium whitespace-nowrap flex-shrink-0">
          {resultsCount} products
        </span>
      </div>
    </motion.div>
  );
};

// ─── MAIN PRODUCT LISTING PAGE ─────────────────────────────────────────────────
export default function ProductListing({ onNavigate, onViewProduct }) {
  const navigate = useNavigate();
  const [search, setSearch]         = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [priceRange, setPriceRange] = useState(1000);
  const [minRating, setMinRating]   = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy]         = useState("Relevance");
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter + sort
  const filtered = ALL_PRODUCTS.filter((p) => {
    if (selectedCat !== "All" && p.category !== selectedCat) return false;
    if (p.price > priceRange) return false;
    if (p.rating < minRating) return false;
    if (inStockOnly && !p.inStock) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "Price: Low to High") return a.price - b.price;
    if (sortBy === "Price: High to Low") return b.price - a.price;
    if (sortBy === "Top Rated") return b.rating - a.rating;
    if (sortBy === "Most Reviewed") return b.reviews - a.reviews;
    return 0;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((v) => v + 4);
      setLoadingMore(false);
    }, 800);
  };

  // Reset visible count when filters change
  useEffect(() => setVisibleCount(8), [search, selectedCat, priceRange, minRating, inStockOnly, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans antialiased">
      <Navbar />

      {/* Hero Banner - Video Background */}
      <div className="pt-16 relative min-h-[320px] flex items-center overflow-hidden">
        <video
          autoPlay loop muted playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-emerald-800/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full text-center px-4 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/25 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-emerald-200 text-xs font-bold tracking-widest uppercase">500+ Organic Products</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-3">
            Shop Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-200">Organic Collection</span>
          </h1>
          <p className="text-green-200 text-base max-w-xl mx-auto">Pure, natural, and ethically sourced products for your health, skin, and wellness journey.</p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <TopFilterBar
        search={search} setSearch={setSearch}
        sortBy={sortBy} setSortBy={setSortBy}
        selectedCat={selectedCat} setSelectedCat={setSelectedCat}
        resultsCount={filtered.length}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* AI Strip */}
        <AISuggestionStrip onViewProduct={onViewProduct} />

        <div className="flex gap-8">
          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-36">
              <Sidebar
                selectedCat={selectedCat} setSelectedCat={setSelectedCat}
                priceRange={priceRange} setPriceRange={setPriceRange}
                minRating={minRating} setMinRating={setMinRating}
                inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            <AnimatePresence>
              {(selectedCat !== "All" || minRating > 0 || inStockOnly || priceRange < 1000 || search) && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex flex-wrap gap-2 mb-5">
                  {selectedCat !== "All" && (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      {selectedCat}
                      <button onClick={() => setSelectedCat("All")} className="hover:text-green-900">✕</button>
                    </span>
                  )}
                  {priceRange < 1000 && (
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      Up to ₹{priceRange}
                      <button onClick={() => setPriceRange(1000)} className="hover:text-blue-900">✕</button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      ★ {minRating}+
                      <button onClick={() => setMinRating(0)} className="hover:text-amber-900">✕</button>
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      In Stock
                      <button onClick={() => setInStockOnly(false)} className="hover:text-emerald-900">✕</button>
                    </span>
                  )}
                  {search && (
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      "{search}"
                      <button onClick={() => setSearch("")} className="hover:text-purple-900">✕</button>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            {visible.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visible.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} onViewProduct={onViewProduct} />
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-6xl mb-4">🌿</div>
                <h3 className="text-xl font-extrabold text-stone-700 mb-2">No products found</h3>
                <p className="text-stone-400 text-sm mb-6">Try adjusting your filters or search term</p>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { setSearch(""); setSelectedCat("All"); setPriceRange(1000); setMinRating(0); setInStockOnly(false); }}
                  className="px-6 py-3 bg-green-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-green-200">
                  Clear All Filters
                </motion.button>
              </motion.div>
            )}

            {/* Load More */}
            {hasMore && visible.length > 0 && (
              <div className="flex justify-center mt-10">
                <motion.button
                  onClick={loadMore}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  disabled={loadingMore}
                  className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-green-200/60 disabled:opacity-70 flex items-center gap-3"
                >
                  {loadingMore ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Loading...
                    </>
                  ) : (
                    <>Load More Products <span className="text-green-200 font-normal text-xs">({filtered.length - visibleCount} remaining)</span></>
                  )}
                </motion.button>
              </div>
            )}

            {!hasMore && visible.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center mt-10 py-6 border-t border-stone-100">
                <span className="text-stone-400 text-sm">🌿 You've seen all {filtered.length} products</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
