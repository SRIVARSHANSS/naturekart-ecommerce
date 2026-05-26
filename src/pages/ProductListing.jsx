import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart }     from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth }     from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

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
      <span key={s} className={`${size === "sm" ? "text-[10px]" : "text-xs"} ${s <= Math.round(rating) ? "text-gold" : "text-gold/20"}`}>★</span>
    ))}
    <span className="text-[10px] text-gold-dim ml-1.5 font-sans font-semibold tracking-wider">{rating}</span>
  </div>
);

// ─── All Products Data ─────────────────────────────────────────────────────────
import { useProducts } from "../hooks/useProducts.js";

const CATEGORIES = ["All", "Ayurveda", "Supplements", "Skincare", "Herbal Tea", "Hair Care", "Essential Oils"];
const SORT_OPTIONS = ["Relevance", "Price: Low to High", "Price: High to Low", "Top Rated", "Most Reviewed"];
const tagColors = {
  Bestseller: "bg-surface-light text-gold border border-gold/25",
  New:        "bg-surface-light text-gold border border-gold/25",
  "Top Rated":"bg-surface-light text-gold border border-gold/25",
  Premium:    "bg-surface-light text-gold border border-gold/25",
  Sale:       "bg-surface-light text-gold border border-gold/25",
};

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, index = 0, onViewProduct }) => {
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product._id || product.id);

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
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onViewProduct(product)}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        borderColor: "rgba(201, 168, 76, 0.6)",
        boxShadow: "0 8px 40px rgba(201,168,76,0.15)"
      }}
      className="relative bg-surface rounded-[2px] border border-gold/10 overflow-hidden group cursor-pointer flex flex-col justify-between h-[420px]"
    >
      {/* Tag badge */}
      {product.tag && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-sm text-[9px] font-sans font-bold tracking-widest uppercase ${tagColors[product.tag] || ""}`}>
          {product.tag}
        </div>
      )}

      {/* Out of stock overlay */}
      {!product.inStock && (
        <div className="absolute inset-0 z-20 bg-bg/85 backdrop-blur-[2px] flex items-center justify-center">
          <span className="px-3 py-1.5 border border-gold/30 bg-surface text-gold text-xs font-sans font-bold tracking-widest uppercase rounded-[2px]">Out of Stock</span>
        </div>
      )}

      {/* Image container with Hover Zoom */}
      <div className="relative aspect-square w-full overflow-hidden bg-bg border-b border-gold/10">
        <motion.div 
          className="w-full h-full"
          whileHover={{ scale: 1.08 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img src={product.image} alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
          />
          <div className="w-full h-full hidden flex-col items-center justify-center bg-surface-light text-gold">
            <span className="text-4xl">{product.icon}</span>
            <span className="text-[10px] mt-1 opacity-60 font-semibold tracking-wider uppercase">{product.name}</span>
          </div>
        </motion.div>

        {/* Wishlist */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 w-8 h-8 rounded-sm bg-surface-light border border-gold/10 hover:border-gold/30 flex items-center justify-center text-xs shadow-md transition-colors z-10"
        >
          <span className={wished ? "text-gold" : "text-gold-dim"}>{wished ? "❤️" : "♡"}</span>
        </motion.button>
      </div>

      {/* Info details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[11px] font-accent italic text-gold-dim tracking-wider uppercase block mb-1">
            {product.category || "Organic Formula"}
          </span>
          <h3 className="font-serif font-bold text-gold text-base leading-snug line-clamp-2 hover:text-gold-light transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-gold-dim font-sans text-xs leading-relaxed line-clamp-2 mt-1">{product.desc}</p>
          <div className="mt-2.5">
            <Stars rating={product.rating} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gold/10">
          <div className="flex items-center justify-between">
            <span className="text-base font-sans font-bold text-gold">₹{product.price}</span>
            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={!product.inStock}
              onClick={handleAddToCart}
              className={`px-4 py-2 rounded-[2px] text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-300 ${
                added
                  ? "bg-forest/20 border border-forest text-green-300"
                  : product.inStock
                    ? "bg-gradient-to-r from-gold via-gold-light to-gold text-bg shadow-md shimmer-btn-glow force-text-white"
                    : "bg-surface-light border border-gold/10 text-gold-dim cursor-not-allowed"
              }`}
            >
              {added ? "✓ Added" : product.inStock ? "+ Cart" : "Sold Out"}
            </motion.button>
          </div>
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
      <div className="bg-surface rounded-[2px] border border-gold/10 p-5 shadow-lg">
        <h3 className="font-sans font-bold text-gold text-xs mb-4 tracking-widest uppercase">CATEGORIES</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-sans font-medium tracking-wider uppercase transition-all duration-200 ${
                selectedCat === cat 
                  ? "bg-surface-light text-gold border border-gold/25" 
                  : "text-gold-dim hover:text-gold hover:bg-surface-light/50"
              }`}
            >
              <span>{cat}</span>
              {selectedCat === cat && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-surface rounded-[2px] border border-gold/10 p-5 shadow-lg">
        <h3 className="font-sans font-bold text-gold text-xs mb-4 tracking-widest uppercase">PRICE RANGE</h3>
        <div className="space-y-3">
          <input type="range" min={100} max={1000} step={10} value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full accent-gold cursor-pointer" />
          <div className="flex justify-between text-[10px] text-gold-dim font-sans font-semibold tracking-wider">
            <span>₹100</span>
            <span className="text-gold font-extrabold">Up to ₹{priceRange}</span>
            <span>₹1000</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="bg-surface rounded-[2px] border border-gold/10 p-5 shadow-lg">
        <h3 className="font-sans font-bold text-gold text-xs mb-4 tracking-widest uppercase">MIN RATING</h3>
        <div className="space-y-2">
          {[4.5, 4, 3.5, 0].map((r) => (
            <motion.button
              key={r}
              onClick={() => setMinRating(r)}
              whileHover={{ x: 3 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-sans tracking-wide transition-all ${
                minRating === r ? "bg-surface-light border border-gold/25" : "hover:bg-surface-light/40"
              }`}
            >
              <span className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${minRating === r ? "border-gold bg-gold" : "border-gold/30"}`}>
                {minRating === r && <span className="text-bg text-[8px] font-bold">✓</span>}
              </span>
              <span className="flex items-center gap-1 font-medium text-gold-dim group-hover:text-gold uppercase tracking-wider text-[10px]">
                {r > 0 ? (
                  <><span className="text-gold">{"★".repeat(Math.floor(r))}</span> <span className="text-[9px]">{r}+</span></>
                ) : "All Ratings"}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="bg-surface rounded-[2px] border border-gold/10 p-5 shadow-lg">
        <h3 className="font-sans font-bold text-gold text-xs mb-4 tracking-widest uppercase">AVAILABILITY</h3>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${inStockOnly ? "bg-gold" : "bg-surface-light border border-gold/20"}`}
          >
            <motion.div animate={{ x: inStockOnly ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${inStockOnly ? "bg-bg" : "bg-gold"}`} />
          </div>
          <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold-dim">In Stock Only</span>
        </label>
      </div>
    </motion.aside>
  );
};

// ─── AI Suggestion Strip ───────────────────────────────────────────────────────
// ─── AI Suggestion Strip ───────────────────────────────────────────────────────
const AISuggestionStrip = ({ onViewProduct }) => {
  const scrollRef = useRef(null);
  const { products } = useProducts();
  const AI_RECS = products.length > 0
    ? products.filter(p => p.rating >= 4.5).slice(0, 8)
    : [];
  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  if (AI_RECS.length === 0) return null;

  return (
    <FadeUp className="mb-10">
      <div className="bg-surface border border-gold/15 rounded-sm p-6 relative overflow-hidden shadow-2xl">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-sm flex items-center justify-center text-lg">
              ✨
            </motion.div>
            <div>
              <div className="text-gold font-serif text-base tracking-wider">AI Picks For You</div>
              <div className="text-gold-dim/75 font-accent italic text-xs">Recommended based on your botanical wellness profile</div>
            </div>
          </div>
          <div className="flex gap-2">
            {[-1, 1].map((dir) => (
              <motion.button key={dir} onClick={() => scroll(dir)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-8 h-8 bg-surface-light hover:bg-surface-light/80 border border-gold/10 hover:border-gold/30 rounded-sm flex items-center justify-center text-gold text-xs transition-all">
                {dir === -1 ? "←" : "→"}
              </motion.button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10" style={{ scrollbarWidth: "none" }}>
          {AI_RECS.map((product, i) => (
            <motion.div
              key={product._id || product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, borderColor: "rgba(201, 168, 76, 0.4)" }}
              onClick={() => onViewProduct(product)}
              className="flex-shrink-0 w-48 bg-surface-light border border-gold/10 rounded-sm overflow-hidden cursor-pointer group"
            >
              <div className="relative overflow-hidden h-28 bg-bg border-b border-gold/10">
                <motion.img whileHover={{ scale: 1.08 }} transition={{ duration: 0.35 }}
                  src={product.image} alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
                {product.tag && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-sm text-[8px] font-sans font-bold tracking-widest uppercase ${tagColors[product.tag] || ""}`}>{product.tag}</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-white text-xs font-serif leading-tight line-clamp-2 mb-1 group-hover:text-gold transition-colors">{product.name}</p>
                <p className="text-gold text-xs font-sans font-bold">₹{product.price}</p>
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
      className="sticky top-16 z-40 bg-surface/90 backdrop-blur-xl border-b border-gold/10 shadow-lg py-3.5 px-4 mb-8"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <motion.div animate={{ borderColor: focused ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.15)" }}
          className="relative flex-1 min-w-0 rounded-sm border bg-surface-light transition-all duration-200">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold-dim text-xs">🔍</span>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Search our apothecary..."
            className="w-full pl-9 pr-4 py-2 rounded-sm bg-transparent text-sm text-[#F5F0E8] placeholder-gold/30 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-dim hover:text-gold text-xs">✕</button>
          )}
        </motion.div>

        {/* Category quick pills */}
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto">
          {CATEGORIES.slice(0, 4).map((cat) => (
            <motion.button key={cat} onClick={() => setSelectedCat(cat)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-200 border ${
                selectedCat === cat 
                  ? "bg-gold text-bg border-gold shadow-md shadow-gold/10" 
                  : "bg-surface-light text-gold-dim border-gold/10 hover:text-gold hover:border-gold/30"
              }`}>
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-sm border border-gold/10 text-xs font-sans font-bold tracking-widest uppercase text-gold bg-surface-light focus:outline-none focus:border-gold/40 cursor-pointer flex-shrink-0">
          {SORT_OPTIONS.map((opt) => <option key={opt} className="bg-surface text-[#F5F0E8]">{opt}</option>)}
        </select>

        <span className="text-[10px] text-gold-dim font-sans font-semibold tracking-wider whitespace-nowrap flex-shrink-0 uppercase">
          {resultsCount} Apothecary items
        </span>
      </div>
    </motion.div>
  );
};

// ─── MAIN PRODUCT LISTING PAGE ─────────────────────────────────────────────────
export default function ProductListing({ onNavigate, onViewProduct }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { products: ALL_PRODUCTS, loading: productsLoading, error: productsError } = useProducts();

  const [search, setSearch]         = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    if (searchQuery !== null) {
      setSearch(searchQuery);
    }
  }, [location.search]);
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
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description || p.desc || '').toLowerCase().includes(search.toLowerCase())) return false;
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
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      {/* Hero Banner - Video Background */}
      <div className="pt-16 relative min-h-[320px] flex items-center overflow-hidden">
        <video
          autoPlay loop muted playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full text-center px-4 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/20 rounded-sm mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase">Premium Apothecary Formulation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight mb-3">
            Shop Our <span className="font-accent italic text-gold">Organic Collection</span>
          </h1>
          <p className="text-gold-dim text-sm max-w-xl mx-auto font-sans leading-relaxed">Pure, natural, and ethically sourced formulations for your health, skin, and botanical wellness journey.</p>
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
                    <span className="px-3 py-1 bg-gold/10 text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase border border-gold/20 rounded-sm flex items-center gap-2">
                      {selectedCat}
                      <button onClick={() => setSelectedCat("All")} className="hover:text-white transition-colors">✕</button>
                    </span>
                  )}
                  {priceRange < 1000 && (
                    <span className="px-3 py-1 bg-gold/10 text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase border border-gold/20 rounded-sm flex items-center gap-2">
                      Up to ₹{priceRange}
                      <button onClick={() => setPriceRange(1000)} className="hover:text-white transition-colors">✕</button>
                    </span>
                  )}
                  {minRating > 0 && (
                    <span className="px-3 py-1 bg-gold/10 text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase border border-gold/20 rounded-sm flex items-center gap-2">
                      ★ {minRating}+
                      <button onClick={() => setMinRating(0)} className="hover:text-white transition-colors">✕</button>
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="px-3 py-1 bg-gold/10 text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase border border-gold/20 rounded-sm flex items-center gap-2">
                      In Stock
                      <button onClick={() => setInStockOnly(false)} className="hover:text-white transition-colors">✕</button>
                    </span>
                  )}
                  {search && (
                    <span className="px-3 py-1 bg-gold/10 text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase border border-gold/20 rounded-sm flex items-center gap-2">
                      "{search}"
                      <button onClick={() => setSearch("")} className="hover:text-white transition-colors">✕</button>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid */}
            {productsLoading && visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full mb-4" />
                <p className="text-gold-dim text-sm">Seeking botanical formulations...</p>
              </div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visible.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} onViewProduct={onViewProduct} />
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4 opacity-55">🌿</div>
                <h3 className="text-lg font-serif font-bold text-gold mb-2">No formulations found</h3>
                <p className="text-gold-dim/70 text-xs mb-6 max-w-xs">Adjust your botanical filters or refine your search query.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSearch(""); setSelectedCat("All"); setPriceRange(1000); setMinRating(0); setInStockOnly(false); }}
                  className="px-6 py-3 bg-gold hover:bg-gold-light text-bg font-sans font-bold text-xs tracking-widest uppercase rounded-sm transition-all duration-300 shimmer-btn-glow">
                  Clear All Filters
                </motion.button>
              </motion.div>
            )}

            {/* Load More */}
            {hasMore && visible.length > 0 && (
              <div className="flex justify-center mt-12">
                <motion.button
                  onClick={loadMore}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={loadingMore}
                  className="px-10 py-4 bg-surface-light border border-gold/30 hover:border-gold text-gold font-sans font-bold text-xs tracking-widest uppercase rounded-sm transition-all duration-300 shimmer-btn-glow flex items-center gap-3 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        className="block w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full" />
                      Seeking...
                    </>
                  ) : (
                    <>Reveal More Formulations <span className="text-gold-dim font-normal text-[10px] ml-1">({filtered.length - visibleCount} left)</span></>
                  )}
                </motion.button>
              </div>
            )}

            {!hasMore && visible.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center mt-14 py-6 border-t border-gold/10">
                <span className="text-gold-dim/60 font-accent italic text-xs">🌿 Full catalog explored ({filtered.length} products total)</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
