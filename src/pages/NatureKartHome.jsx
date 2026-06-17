import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence, useMotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart }     from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth }     from "../context/AuthContext.jsx";
import { ALL_PRODUCTS } from "../data/products.js"; // kept as fallback
import { useProducts } from "../hooks/useProducts.js";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

// ─── Utility ──────────────────────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerContainer = ({ children, className = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = "" }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Image Placeholder ────────────────────────────────────────────────────────
const ImgPlaceholder = ({ className = "", label = "Image", icon = "🌿" }) => (
  <div
    className={`flex flex-col items-center justify-center bg-surface-light rounded-md border border-gold/20 text-gold/40 select-none ${className}`}
  >
    <span className="text-3xl mb-2">{icon}</span>
    <span className="text-xs font-semibold tracking-widest uppercase opacity-60">{label}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HERO SECTION — VIDEO BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════
const WordAnim = ({ text }) => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };
  const child = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };
  return (
    <motion.span variants={container} initial="hidden" animate="visible" className="inline-flex flex-wrap justify-center w-full">
      {text.split(" ").map((word, wordIdx) => (
        <span key={wordIdx} className="whitespace-nowrap mr-[0.3em] inline-flex">
          {Array.from(word).map((char, charIdx) => (
            <motion.span key={charIdx} variants={child} className="inline-block">
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
};

const Hero = ({ onNavigate }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX - innerWidth / 2) / (innerWidth / 2);
    const y = (clientY - innerHeight / 2) / (innerHeight / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const leaf1X = useTransform(mouseX, [-1, 1], [-25, 25]);
  const leaf1Y = useTransform(mouseY, [-1, 1], [-25, 25]);
  const leaf2X = useTransform(mouseX, [-1, 1], [30, -30]);
  const leaf2Y = useTransform(mouseY, [-1, 1], [30, -30]);

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-[#0d0d0b] dark-section"
    >
      <video
        autoPlay loop muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <source src="/videos/8928705-uhd_3840_2160_25fps.mp4" type="video/mp4" />
      </video>

      {/* Clearer luxury bottom-to-top gradient mask */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: "linear-gradient(to top, rgba(13,13,11,0.5) 0%, rgba(13,13,11,0.3) 60%, rgba(13,13,11,0.05) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: "radial-gradient(circle at center, transparent 40%, rgba(13,13,11,0.35) 100%)",
        }}
      />

      {/* Parallax Drifting Leaves */}
      <motion.div 
        style={{ x: leaf1X, y: leaf1Y, zIndex: 2 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="absolute top-24 left-10 w-28 h-28 pointer-events-none opacity-[0.12] hidden md:block"
      >
        <svg viewBox="0 0 100 100" fill="none" stroke="#C9A84C" strokeWidth="1.5">
          <path d="M50,0 C65,30 65,70 50,100 C35,70 35,30 50,0 Z" />
          <path d="M50,0 Q55,45 50,100" />
        </svg>
      </motion.div>
      <motion.div 
        style={{ x: leaf2X, y: leaf2Y, zIndex: 2 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-24 right-12 w-32 h-32 pointer-events-none opacity-[0.15] hidden md:block"
      >
        <svg viewBox="0 0 100 100" fill="none" stroke="#C9A84C" strokeWidth="1">
          <path d="M50,0 C80,25 80,75 50,100 C20,75 20,25 50,0 Z" />
          <path d="M50,0 L50,100" />
          <path d="M50,20 Q65,40 50,60" />
          <path d="M50,40 Q35,60 50,80" />
        </svg>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative" style={{ zIndex: 3 }}>
        <div className="flex flex-col items-center justify-center text-center py-16 lg:py-24 max-w-3xl mx-auto">

          {/* Text Side Centered */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-surface-light border border-gold/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-xs font-sans font-bold tracking-widest uppercase">AI-Powered Organic Apothecary</span>
            </motion.div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-white leading-[1.12] tracking-tight mb-6 text-center w-full"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              <span className="block w-full text-center">
                <WordAnim text="100% Natural & Organic" />
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold mt-1">
                Products
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base text-gold-dim font-sans leading-relaxed mb-8 max-w-lg mx-auto"
            >
              Shop herbal, eco-friendly, and sustainable products — powered by bespoke AI recommendations tailored to your unique wellness goals.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-10"
            >
              <motion.button
                onClick={() => onNavigate("shop")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-gradient-to-r from-gold via-gold-light to-gold text-bg font-sans font-bold tracking-widest uppercase text-xs rounded-[2px] shadow-lg shadow-gold/10 shimmer-btn-glow"
              >
                Shop Now →
              </motion.button>
              <motion.button
                onClick={() => onNavigate("shop")}
                whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-transparent text-white font-sans font-bold tracking-widest uppercase text-xs rounded-[2px] border border-white/30 hover:border-white shadow-lg transition-colors"
              >
                Explore Products
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="flex justify-center gap-8 border-t border-gold/10 pt-6 w-full max-w-md mx-auto"
            >
              {[
                { val: "500+", label: "Pure Formulas" },
                { val: "12K+", label: "Patrons" },
                { val: "100%", label: "Lab Verified" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center flex-1">
                  <div className="text-xl font-serif font-bold text-white">{val}</div>
                  <div className="text-[10px] text-gold-dim font-sans font-semibold tracking-wider uppercase mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Pulsing Thin Golden Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
        <span className="text-[9px] font-sans text-gold tracking-widest uppercase opacity-60">Scroll</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-[1px] h-10 bg-gradient-to-b from-gold to-transparent" 
        />
      </div>
    </section>
  );
};

// ─── 3. CATEGORY SECTION ─────────────────────────────────────────────────────
const categories = [
  { name: "Herbal Products", icon: "🌿", desc: "Roots, leaves & extracts" },
  { name: "Organic Foods",   icon: "🥗", desc: "Wholesome & pure" },
  { name: "Skincare",        icon: "✨", desc: "Natural glow, zero harm" },
  { name: "Herbal Tea",      icon: "🍵", desc: "Calm & energize" },
  { name: "Ayurveda",        icon: "🪴", desc: "Ancient wisdom" },
  { name: "Essential Oils",  icon: "💧", desc: "Pure & aromatic" },
];

const Categories = ({ onNavigate }) => (
  <section className="py-20 lg:py-28 bg-bg border-t border-gold/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FadeUp className="text-center mb-14">
        <span className="inline-block text-xs font-sans font-bold text-gold tracking-widest uppercase mb-3">Browse by Category</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">Curated Apothecary Collections</h2>
        <p className="mt-4 text-gold-dim font-sans text-sm max-w-xl mx-auto">
          From ancient Ayurvedic remedies to handcrafted organic superfoods — explore our clinical grades.
        </p>
      </FadeUp>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map(({ name, icon, desc }) => (
          <StaggerItem key={name}>
            <motion.div
              onClick={() => onNavigate("shop")}
              whileHover={{ y: -6, borderColor: "rgba(201, 168, 76, 0.5)", boxShadow: "0 12px 30px rgba(201,168,76,0.06)" }}
              whileTap={{ scale: 0.98 }}
              className="relative cursor-pointer rounded-[2px] bg-surface border border-gold/10 p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 group"
            >
              {/* Top corner accent */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/20 group-hover:border-gold/50 transition-colors" />
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-serif text-sm text-[#F5F0E8]/80 group-hover:text-gold transition-colors">{name}</p>
                <p className="text-[10px] text-[#F5F0E8]/30 mt-0.5 tracking-wide font-sans">{desc}</p>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

/* ── Tag colors ── */
const tagColors = {
  Bestseller: "bg-surface-light text-gold border border-gold/25",
  New:        "bg-surface-light text-gold border border-gold/25",
  "Top Rated":"bg-surface-light text-gold border border-gold/25",
  Premium:    "bg-surface-light text-gold border border-gold/25",
  Sale:       "bg-surface-light text-gold border border-gold/25",
};

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`text-xs ${s <= Math.round(rating) ? "text-gold" : "text-gold/20"}`}>★</span>
    ))}
    <span className="text-[10px] text-gold-dim ml-1.5 font-sans font-semibold tracking-wider">{rating}</span>
  </div>
);

const ProductCard = ({ product, onNavigate, onViewProduct }) => {
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product._id || product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div
      onClick={() => onViewProduct && onViewProduct(product)}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        borderColor: "rgba(201, 168, 76, 0.6)",
        boxShadow: "0 8px 40px rgba(201,168,76,0.15)"
      }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-bigbox rounded-[2px] border border-gold/10 overflow-hidden group cursor-pointer flex flex-col justify-between h-[390px]"
    >
      {product.tag && (
        <div className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded-sm text-[9px] font-sans font-bold tracking-widest uppercase ${tagColors[product.tag] || ""}`}>
          {product.tag}
        </div>
      )}

      {/* Image Container with Hover Zoom */}
      <div className="relative aspect-square w-full overflow-hidden bg-bg border-b border-gold/10">
        <motion.div 
          className="w-full h-full"
          whileHover={{ scale: 1.08 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-light text-gold" style={{ display: "none" }}>
            <span className="text-4xl">{product.icon}</span>
            <span className="text-[10px] mt-1 opacity-60 font-semibold tracking-wider uppercase">{product.name}</span>
          </div>
        </motion.div>

        {/* Favorite Icon */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-sm bg-surface-light border border-gold/10 hover:border-gold/30 flex items-center justify-center text-xs shadow-md transition-colors"
        >
          <span className={wished ? "text-gold" : "text-gold-dim"}>{wished ? "❤️" : "♡"}</span>
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-accent italic text-gold-dim tracking-wider uppercase block mb-1">
            {product.category || "Organic Formula"}
          </span>
          <h3 className="font-serif font-bold text-gold text-base leading-snug line-clamp-2 hover:text-gold-light transition-colors duration-200">
            {product.name}
          </h3>
          <div className="mt-2">
            <Stars rating={product.rating} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gold/10">
          <div className="flex items-center justify-between">
            <span className="text-base font-sans font-bold text-gold">₹{product.price}</span>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleAddToCart}
              className={`px-4 py-2 rounded-[2px] text-[10px] font-sans font-bold tracking-widest uppercase transition-all duration-300 ${
                added
                  ? "bg-forest/20 border border-forest text-green-300"
                  : "bg-gradient-to-r from-gold via-gold-light to-gold text-bg shadow-md shimmer-btn-glow force-text-white"
              }`}
            >
              {added ? "✓ Added" : "+ Cart"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedProducts = ({ onNavigate, onViewProduct }) => {
  const { products: liveProducts } = useProducts();
  const products = liveProducts.length > 0 ? liveProducts.slice(0, 8) : ALL_PRODUCTS.slice(0, 8);

  return (
    <section
      className="py-20 lg:py-28 relative bg-bg dark-section"
      style={{
        backgroundImage: "url('/images/featured-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(13,13,11,0.98) 0%, rgba(20,20,16,0.96) 50%, rgba(13,13,11,0.98) 100%)" }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeUp className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-xs font-sans font-bold text-gold tracking-widest uppercase mb-2">Botanical Apothecary Favorites</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">Featured Formulations</h2>
          </div>
          <motion.button
            onClick={() => onNavigate("shop")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 px-6 py-2.5 rounded-[2px] border border-white/40 text-white hover:border-white hover:bg-white/10 font-sans font-bold text-xs uppercase tracking-widest transition-colors duration-200"
          >
            View All formulations →
          </motion.button>
        </FadeUp>

        {products.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <StaggerItem key={p._id || p.id}>
                <ProductCard product={p} onNavigate={onNavigate} onViewProduct={onViewProduct} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
};

// ─── 5. AI HEALTH SUGGESTION ─────────────────────────────────────────────────
const AIBanner = ({ onNavigate }) => {
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleSuggest = () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult(`Based on "${query}", we recommend: Ashwagandha, Brahmi, and Triphala. These products may support your wellness goals naturally.`);
    }, 1600);
  };

  return (
    <section className="py-20 lg:py-24 relative overflow-hidden bg-bg border-t border-gold/10">
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-surface to-bg" />
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gold blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-gold-light blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <FadeUp>
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 mx-auto mb-6 rounded-md bg-surface border border-gold/20 flex items-center justify-center text-2xl shadow-lg">
            🤖
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight mb-4">
            Not Sure What to Choose?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold">Let Bespoke AI Guide You</span>
          </h2>
          <p className="text-gold-dim font-sans text-sm mb-10 max-w-lg mx-auto">
            Describe your current health concern or wellness goal, and our apothecary AI will recommend premium formulations tailored for you.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="bg-bigbox border border-gold/20 rounded-[2px] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                placeholder="Describe what you are looking for (e.g., stress, glow, immunity, energy)..."
                className="flex-1 px-5 py-4 rounded-[2px] bg-bg border border-gold/15 text-white placeholder-gold-dim/40 text-sm focus:outline-none focus:border-gold transition-colors duration-200"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSuggest}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-gold via-gold-light to-gold text-bg font-sans font-bold tracking-widest text-xs uppercase rounded-[2px] shadow-lg disabled:opacity-75 whitespace-nowrap shimmer-btn-glow"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="block w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full" />
                    Analysing...
                  </span>
                ) : "✨ Get Suggestions"}
              </motion.button>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 p-5 bg-surface-light border border-gold/20 rounded-[2px] text-white text-sm leading-relaxed text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <span className="font-serif font-bold text-gold block mb-1">🌿 Botanical Recommendation:</span>
                    <span className="text-gold-dim">{result}</span>
                  </div>
                  <button
                    onClick={() => onNavigate("ai")}
                    className="flex-shrink-0 px-3 py-1.5 border border-gold/30 hover:border-gold text-gold text-xs font-sans font-bold tracking-widest uppercase rounded-[2px] transition-colors"
                  >
                    Bespoke Desk →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

// ─── 6. WHY CHOOSE US ─────────────────────────────────────────────────────────
const features = [
  { icon: "🌿", title: "100% Organic",    desc: "USDA & India Organic certified formulas, free from synthetic pesticides." },
  { icon: "🚫", title: "Zero Harmful Additives",    desc: "Strictly pure and unrefined. No binders, fillers, or artificial colors." },
  { icon: "⚡", title: "Expedited Courier",   desc: "Hand-packaged at our botanical centers and shipped directly to your door." },
  { icon: "🏆", title: "Certified Clinical Grade", desc: "Formulations tested by third-party laboratories for safety and potency." },
];

const WhyUs = () => (
  <section className="py-20 lg:py-28 bg-bg border-t border-gold/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FadeUp className="text-center mb-14">
        <span className="inline-block text-xs font-sans font-bold text-gold tracking-widest uppercase mb-3">Our Standards</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">Pure, Handcrafted Excellence</h2>
      </FadeUp>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon, title, desc }) => (
          <StaggerItem key={title}>
            <motion.div
              whileHover={{ y: -6, borderColor: "rgba(201, 168, 76, 0.4)", boxShadow: "0 10px 30px rgba(201,168,76,0.05)" }}
              className="bg-bigbox border border-gold/10 rounded-[2px] p-8 text-center group transition-all duration-300"
            >
              <motion.div whileHover={{ scale: 1.1, rotate: -3 }}
                className="w-12 h-12 mx-auto mb-5 bg-surface-light border border-gold/10 rounded-sm flex items-center justify-center text-2xl group-hover:border-gold/30">
                {icon}
              </motion.div>
              <h3 className="font-serif font-bold text-white mb-2 text-base">{title}</h3>
              <p className="text-gold-dim text-xs leading-relaxed font-sans">{desc}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

// ─── 7. TESTIMONIALS ──────────────────────────────────────────────────────────
const testimonials = [
  { name: "Priya Sharma",    location: "Mumbai",    rating: 5, role: "Yoga Instructor",  text: "NatureKart completely changed my morning routine. The Ashwagandha powder is incredibly authentic and I feel an amazing difference in my daily energy levels!" },
  { name: "Rajan Mehta",     location: "Bangalore", rating: 5, role: "Software Engineer", text: "The AI suggestion feature recommended Triphala for my digestion issues and it has been a game-changer. Exquisite product quality." },
  { name: "Ananya Krishnan", location: "Chennai",   rating: 5, role: "Nutritionist",      text: "I love that everything is certified organic. No more worrying about synthetic chemicals. The Rose Hip oil is absolutely gorgeous!" },
];

const Testimonials = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % testimonials.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-bg border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-14">
          <span className="inline-block text-xs font-sans font-bold text-gold tracking-widest uppercase mb-3">Apothecary Patrons</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">Verified Experiences</h2>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              onClick={() => setActive(i)}
              className={`relative bg-bigbox rounded-[2px] border p-8 cursor-pointer transition-all duration-300 ${active === i ? "border-gold" : "border-gold/10"}`}
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => <span key={j} className="text-gold text-xs">★</span>)}
              </div>
              <p className="text-gold-dim font-accent italic text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-light border border-gold/10 rounded-full flex items-center justify-center font-bold text-gold text-xs font-sans">
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-serif font-bold text-white text-xs">{t.name}</div>
                  <div className="text-[10px] text-gold-dim font-sans uppercase tracking-wider">{t.role} · {t.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`h-1 transition-all duration-300 ${active === i ? "w-8 bg-gold" : "w-2 bg-gold/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── 8. NEWSLETTER ───────────────────────────────────────────────────────────
const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [done, setDone]   = useState(false);

  return (
    <section className="py-20 bg-bigbox border-t border-gold/10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #C9A84C 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
        <FadeUp>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3">Join The Apothecary Circle</h2>
          <p className="text-gold-dim font-sans text-sm mb-8">Receive handpicked wellness recommendations, botanical guides, and exclusive releases.</p>
          {done ? (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-5 text-gold font-bold text-sm uppercase tracking-widest font-sans">
              ✓ Subscribed to the Apothecary Circle. Welcome.
            </motion.div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 rounded-[2px] bg-bg border border-gold/15 text-white placeholder-gold-dim/40 text-sm focus:outline-none focus:border-gold transition-colors duration-200"
              />
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => email && setDone(true)}
                className="px-8 py-4 bg-gradient-to-r from-gold via-gold-light to-gold text-bg font-sans font-bold tracking-widest text-xs uppercase rounded-[2px] shadow-lg whitespace-nowrap shimmer-btn-glow"
              >
                Subscribe
              </motion.button>
            </div>
          )}
        </FadeUp>
      </div>
    </section>
  );
};

export default function NatureKartHome({ onNavigate, onViewProduct }) {
  return (
    <div className="font-sans antialiased bg-bg">
      <Navbar />
      <Hero onNavigate={onNavigate} />
      <Categories onNavigate={onNavigate} />
      <FeaturedProducts onNavigate={onNavigate} onViewProduct={onViewProduct} />
      <AIBanner onNavigate={onNavigate} />
      <WhyUs />
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  );
}