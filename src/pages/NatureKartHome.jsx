import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCart }     from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth }     from "../context/AuthContext.jsx";
import { ALL_PRODUCTS } from "../data/products.js"; // kept as fallback
import { useProducts } from "../hooks/useProducts.js";

// ─── Utility ──────────────────────────────────────────────────────────────────
const useScrolled = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
};

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
    className={`flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-2 border-dashed border-green-200 text-green-400 select-none ${className}`}
  >
    <span className="text-3xl mb-2">{icon}</span>
    <span className="text-xs font-semibold tracking-widest uppercase opacity-60">{label}</span>
  </div>
);

const Navbar = ({ onNavigate }) => {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount }  = useCart();
  const { wishlist }   = useWishlist();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  /* Hidden admin entry: double-click the 🌿 logo */
  const clickTimerRef = useRef(null);
  const handleLogoClick = () => {
    if (clickTimerRef.current) {
      // Second click — it's a double-click
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      navigate('/admin/dashboard');
    } else {
      // First click — wait 400 ms for second
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        navigate('/');
      }, 400);
    }
  };

  const navLinks = [
    { label: "Home",    action: () => navigate("/")    },
    { label: "Shop",    action: () => navigate("/shop") },
    { label: "About",   action: () => navigate("/")    },
    { label: "Contact", action: () => navigate("/")    },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-green-100/50 border-b border-green-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo — double-click secretly opens admin panel */}
          <motion.button
            onClick={handleLogoClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-300/40">
              <span className="text-white text-lg">🌿</span>
            </div>
            <span className="text-xl font-bold tracking-tight drop-shadow-md"
              style={{ color: scrolled ? "#166534" : "#fff" }}>
              Nature<span style={{ color: scrolled ? "#10b981" : "#6ee7b7" }}>Kart</span>
            </span>
          </motion.button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, action }) => (
              <motion.button
                key={label}
                onClick={action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  scrolled
                    ? "text-stone-600 hover:text-green-700 hover:bg-green-50"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Wishlist */}
            <motion.button onClick={() => navigate("/wishlist")}
              whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                scrolled ? "text-stone-600 hover:text-red-500 hover:bg-red-50" : "text-white/80 hover:text-white hover:bg-white/15"
              }`} aria-label="Wishlist">
              <span className="text-lg">❤️</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {wishlist.length}
                </span>
              )}
            </motion.button>

            {/* Profile / Sign In */}
            <motion.button onClick={() => navigate(isLoggedIn ? "/profile" : "/login")}
              whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden ${
                scrolled ? "text-stone-600 hover:text-green-700 hover:bg-green-50" : "text-white/80 hover:text-white hover:bg-white/15"
              }`} aria-label="Profile">
              {isLoggedIn ? (
                <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              ) : (
                <span className="text-lg">👤</span>
              )}
            </motion.button>

            {/* Cart */}
            <motion.button onClick={() => navigate("/cart")}
              whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                scrolled ? "text-stone-600 hover:text-green-700 hover:bg-green-50" : "text-white/80 hover:text-white hover:bg-white/15"
              }`} aria-label="Cart">
              <span className="text-lg">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </motion.button>

            {/* Sign In (Hidden if logged in) */}
            {!isLoggedIn && (
              <motion.button onClick={() => navigate("/login")}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                className={`ml-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                  scrolled
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-300/40"
                    : "bg-white/20 backdrop-blur-sm border border-white/30 text-white"
                }`}>
                Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          >
            {["top", "mid", "bot"].map((pos) => (
              <span
                key={pos}
                className={`w-6 h-0.5 rounded transition-all ${scrolled ? "bg-stone-700" : "bg-white"} ${
                  pos === "top" && menuOpen ? "rotate-45 translate-y-2" : ""
                } ${pos === "mid" && menuOpen ? "opacity-0" : ""} ${
                  pos === "bot" && menuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            ))}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-green-100 px-4 pb-4"
          >
            {navLinks.map(({ label, page }) => (
              <button
                key={label}
                onClick={() => { onNavigate(page); setMenuOpen(false); }}
                className="block w-full text-left py-3 text-stone-700 font-semibold border-b border-stone-100 hover:text-green-700"
              >
                {label}
              </button>
            ))}
            {!isLoggedIn && (
              <button onClick={() => navigate("/login")}
                className="mt-4 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl">
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HERO SECTION — VIDEO BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════
const Hero = ({ onNavigate }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 80]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">

      <video
        autoPlay loop muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: "linear-gradient(135deg, rgba(5,46,22,0.75) 0%, rgba(6,78,59,0.62) 50%, rgba(5,46,22,0.58) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.40) 100%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative" style={{ zIndex: 3 }}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-24">

          {/* Text Side */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-sm font-semibold tracking-wide">AI-Powered Organic Marketplace</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6"
              style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
            >
              100% Natural &amp;{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-200">
                  Organic
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C40 2 80 2 100 4C120 6 160 6 198 2" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              Products
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg text-white/80 leading-relaxed mb-8 max-w-lg"
            >
              Shop herbal, eco-friendly, and sustainable products — powered by AI recommendations tailored to your health needs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              {/* NAVIGATION: Shop Now → goes to /shop */}
              <motion.button
                onClick={() => onNavigate("shop")}
                whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(16,185,129,0.50)" }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-green-900/40 transition-all duration-200"
              >
                Shop Now →
              </motion.button>
              {/* NAVIGATION: Explore Products → also goes to /shop */}
              <motion.button
                onClick={() => onNavigate("shop")}
                whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.25)" }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-4 bg-white/15 backdrop-blur-sm text-white font-bold text-base rounded-2xl border-2 border-white/30 shadow-lg transition-all duration-200"
              >
                Explore Products
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-8"
            >
              {[
                { val: "500+", label: "Products" },
                { val: "12K+", label: "Happy Customers" },
                { val: "100%", label: "Organic" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div className="text-2xl font-extrabold text-white drop-shadow">{val}</div>
                  <div className="text-xs text-white/60 font-semibold tracking-wide uppercase mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Image / Product Side */}
          <motion.div
            style={{ y }}
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center items-center"
          >
            <div className="absolute w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-30" />
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <img
                src="/images/hero-product.png"
                alt="Hero Product"
                className="w-72 md:w-80 lg:w-96 object-contain mx-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── 3. CATEGORY SECTION ─────────────────────────────────────────────────────
const categories = [
  { name: "Herbal Products", icon: "🌿", desc: "Roots, leaves & extracts", color: "from-green-100 to-green-50" },
  { name: "Organic Foods",   icon: "🥗", desc: "Wholesome & pure",         color: "from-lime-100 to-lime-50" },
  { name: "Skincare",        icon: "✨", desc: "Natural glow, zero harm",   color: "from-yellow-100 to-yellow-50" },
  { name: "Herbal Tea",      icon: "🍵", desc: "Calm & energize",           color: "from-amber-100 to-amber-50" },
  { name: "Ayurveda",        icon: "🪴", desc: "Ancient wisdom",            color: "from-emerald-100 to-emerald-50" },
  { name: "Essential Oils",  icon: "💧", desc: "Pure & aromatic",           color: "from-teal-100 to-teal-50" },
];

const Categories = ({ onNavigate }) => (
  <section className="py-20 lg:py-28 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FadeUp className="text-center mb-14">
        <span className="inline-block text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">Browse by Category</span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 tracking-tight">What Are You Looking For?</h2>
        <p className="mt-4 text-stone-400 text-lg max-w-xl mx-auto">
          From ancient Ayurveda to modern organic foods — find everything in one place.
        </p>
      </FadeUp>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map(({ name, icon, desc, color }) => (
          <StaggerItem key={name}>
            {/* NAVIGATION: clicking a category goes to the shop page */}
            <motion.div
              onClick={() => onNavigate("shop")}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
              whileTap={{ scale: 0.97 }}
              className={`relative cursor-pointer rounded-2xl bg-gradient-to-br ${color} border border-white p-5 flex flex-col items-center text-center gap-3 overflow-hidden group`}
            >
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                className="w-14 h-14 rounded-xl bg-white/80 flex items-center justify-center text-3xl shadow-sm"
              >
                {icon}
              </motion.div>
              <div>
                <div className="font-bold text-stone-700 text-sm leading-tight">{name}</div>
                <div className="text-xs text-stone-400 mt-0.5">{desc}</div>
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-2xl" />
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

// ─── 4. FEATURED PRODUCTS ────────────────────────────────────────────────────

const tagColors = {
  Bestseller: "bg-amber-100 text-amber-700",
  New:        "bg-blue-100 text-blue-700",
  "Top Rated":"bg-green-100 text-green-700",
  Premium:    "bg-purple-100 text-purple-700",
  Sale:       "bg-red-100 text-red-700",
};

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`text-xs ${s <= Math.round(rating) ? "text-amber-400" : "text-stone-200"}`}>★</span>
    ))}
    <span className="text-xs text-stone-400 ml-1 font-medium">{rating}</span>
  </div>
);

// NAVIGATION: ProductCard accepts onNavigate + onViewProduct to open product detail
const ProductCard = ({ product, onNavigate, onViewProduct }) => {
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.13)" }}
      className="relative bg-white rounded-2xl border border-stone-100 overflow-hidden group cursor-pointer"
    >
      {product.tag && (
        <div className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${tagColors[product.tag] || ""}`}>
          {product.tag}
        </div>
      )}

      {/* NAVIGATION: clicking the image goes to product details */}
      <div className="relative overflow-hidden" onClick={() => onViewProduct && onViewProduct(product)}>
        <motion.div whileHover={{ scale: 1.06 }} transition={{ duration: 0.4 }}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-44 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div className="w-full h-44 flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-green-400" style={{ display: "none" }}>
            <span className="text-4xl">{product.icon}</span>
            <span className="text-xs mt-1 opacity-60 font-semibold">{product.name}</span>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
          className={`absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-xl flex items-center justify-center shadow-md transition-colors ${wished ? "text-red-500" : "text-stone-400 hover:text-red-400"}`}
        >
          {wished ? "♥" : "♡"}
        </motion.button>
      </div>

      <div className="p-4">
        {/* NAVIGATION: clicking name also goes to product details */}
        <h3
          onClick={() => onViewProduct && onViewProduct(product)}
          className="font-bold text-stone-800 text-sm leading-tight mb-1 hover:text-green-700 transition-colors"
        >
          {product.name}
        </h3>
        <Stars rating={product.rating} />
        <span className="text-xs text-stone-400">({product.reviews} reviews)</span>

        <div className="flex items-center justify-between mt-3">
          <div className="text-xl font-extrabold text-green-700">₹{product.price}</div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleAddToCart}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              added
                ? "bg-green-100 text-green-700"
                : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200/60"
            }`}
          >
            {added ? "✓ Added!" : "+ Cart"}
          </motion.button>
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
    className="py-20 lg:py-28 relative"
    style={{
      backgroundImage: "url('/images/featured-bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      backgroundRepeat: "no-repeat",
    }}
  >
    <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(240,253,244,0.7) 50%, rgba(255,255,255,0.65) 100%)" }} />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <FadeUp className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
        <div>
          <span className="inline-block text-sm font-bold text-emerald-600 tracking-widest uppercase mb-2">Hand-Picked For You</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 tracking-tight">Featured Products</h2>
        </div>
        {/* NAVIGATION: View All → goes to shop page */}
        <motion.button
          onClick={() => onNavigate("shop")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex-shrink-0 px-6 py-2.5 rounded-xl border-2 border-green-200 text-green-700 font-bold text-sm hover:bg-green-50 transition-colors"
        >
          View All →
        </motion.button>
      </FadeUp>

      {products.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
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
    <section className="py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900" />
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-0 left-0 w-96 h-96 rounded-full bg-green-400 blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-300 blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <FadeUp>
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl">
            🤖
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Not Sure What to Buy?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">Let AI Guide You</span>
          </h2>
          <p className="text-green-200 text-lg mb-10 max-w-lg mx-auto">
            Describe your health concern and our AI will recommend the best organic products tailored just for you.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                placeholder="e.g. low energy, stress, dry skin, digestion..."
                className="flex-1 px-5 py-4 rounded-xl bg-white/15 border border-white/20 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400/60 backdrop-blur-sm"
              />
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 32px rgba(52,211,153,0.5)" }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSuggest}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-300 hover:to-emerald-300 text-green-900 font-extrabold text-sm rounded-xl shadow-lg transition-all duration-200 whitespace-nowrap disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="block w-4 h-4 border-2 border-green-900/30 border-t-green-900 rounded-full" />
                    Analysing...
                  </span>
                ) : "✨ Get Suggestions"}
              </motion.button>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 p-4 bg-green-400/10 border border-green-400/30 rounded-xl text-green-100 text-sm leading-relaxed text-left"
                >
                  <span className="font-bold text-green-300">🌿 AI Recommendation: </span>
                  {result}
                  {/* NAVIGATION: Try Full AI page button */}
                  <button
                    onClick={() => onNavigate("ai")}
                    className="ml-3 px-3 py-1 bg-green-400/20 border border-green-400/40 text-green-300 text-xs font-bold rounded-lg hover:bg-green-400/30 transition-colors"
                  >
                    Full AI Page →
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
  { icon: "🌿", title: "100% Organic",    desc: "All products are certified organic, grown without pesticides or synthetic chemicals." },
  { icon: "🚫", title: "No Chemicals",    desc: "We guarantee zero harmful additives — what you see is what nature provides." },
  { icon: "⚡", title: "Fast Delivery",   desc: "Same-day or next-day dispatch from our verified warehouses across India." },
  { icon: "🏆", title: "Trusted Quality", desc: "FSSAI certified and AYUSH approved products with verified lab testing." },
];

const WhyUs = () => (
  <section className="py-20 lg:py-28 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <FadeUp className="text-center mb-14">
        <span className="inline-block text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">Our Promise</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 tracking-tight">Why Choose NatureKart?</h2>
      </FadeUp>
      <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon, title, desc }) => (
          <StaggerItem key={title}>
            <motion.div
              whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(16,185,129,0.12)" }}
              className="bg-gradient-to-br from-stone-50 to-white border border-stone-100 rounded-2xl p-7 text-center group cursor-default"
            >
              <motion.div whileHover={{ scale: 1.15, rotate: -5 }}
                className="w-14 h-14 mx-auto mb-5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
                {icon}
              </motion.div>
              <h3 className="font-extrabold text-stone-800 mb-2 text-base">{title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

// ─── 7. TESTIMONIALS ──────────────────────────────────────────────────────────
const testimonials = [
  { name: "Priya Sharma",    location: "Mumbai",    rating: 5, role: "Yoga Instructor",  text: "NatureKart completely changed my morning routine. The Ashwagandha powder is authentic and I can genuinely feel the difference in my energy levels!" },
  { name: "Rajan Mehta",     location: "Bangalore", rating: 5, role: "Software Engineer", text: "The AI suggestion feature recommended Triphala for my digestion issues and it has been a game-changer. Amazing product quality and super fast delivery." },
  { name: "Ananya Krishnan", location: "Chennai",   rating: 5, role: "Nutritionist",      text: "I love that everything is certified organic. No more worrying about chemicals in my skincare. The Rose Hip oil is absolutely gorgeous!" },
];

const Testimonials = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % testimonials.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-stone-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="text-center mb-14">
          <span className="inline-block text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">Real Reviews</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 tracking-tight">What Our Customers Say</h2>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
              className={`relative bg-white rounded-2xl border-2 p-7 cursor-default transition-all duration-300 ${active === i ? "border-green-300 shadow-xl shadow-green-100/60" : "border-stone-100"}`}
              onClick={() => setActive(i)}
            >
              {active === i && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-50/60 to-transparent pointer-events-none" />}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <ImgPlaceholder className="w-11 h-11 flex-shrink-0 !rounded-full" label="" icon="👤" />
                <div>
                  <div className="font-bold text-stone-800 text-sm">{t.name}</div>
                  <div className="text-xs text-stone-400">{t.role} · {t.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${active === i ? "w-8 bg-green-500" : "w-2 bg-stone-200"}`} />
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
    <section className="py-16 lg:py-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
        <FadeUp>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Stay Healthy, Stay Informed 🌿</h2>
          <p className="text-green-100 text-base mb-8">Get weekly health tips, exclusive offers, and new product launches in your inbox.</p>
          {done ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-5 text-white font-bold text-lg">
              ✅ You're subscribed! Welcome to the NatureKart family.
            </motion.div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
              />
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => email && setDone(true)}
                className="px-8 py-4 bg-white text-green-700 font-extrabold text-sm rounded-xl shadow-lg hover:bg-green-50 transition-colors whitespace-nowrap"
              >
                Subscribe →
              </motion.button>
            </div>
          )}
          <p className="text-green-200 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>
        </FadeUp>
      </div>
    </section>
  );
};

// ─── 9. FOOTER ───────────────────────────────────────────────────────────────
const Footer = ({ onNavigate }) => (
  <footer className="bg-stone-900 text-stone-400 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
        <div className="col-span-2 md:col-span-1">
          <button onClick={() => onNavigate("home")} className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-lg">🌿</span>
            </div>
            <span className="text-xl font-bold text-white">Nature<span className="text-emerald-400">Kart</span></span>
          </button>
          <p className="text-sm leading-relaxed mb-5">India's premier AI-powered organic marketplace. Nature's best, delivered to your doorstep.</p>
          <div className="flex gap-3">
            {["𝕏", "f", "in", "▶"].map((s) => (
              <motion.a key={s} href="#" whileHover={{ scale: 1.15, color: "#34d399" }}
                className="w-9 h-9 bg-stone-800 rounded-xl flex items-center justify-center text-sm text-stone-400 hover:bg-stone-700 transition-colors">
                {s}
              </motion.a>
            ))}
          </div>
        </div>

        {[
          { title: "Shop",    links: [["Herbal Products","shop"],["Organic Foods","shop"],["Skincare","shop"],["Herbal Tea","shop"],["Ayurveda","shop"]] },
          { title: "Company", links: [["About Us","home"],["Careers","home"],["Press","home"],["Blog","home"],["Contact","home"]] },
          { title: "Support", links: [["Track Order","home"],["Returns","home"],["FAQ","home"],["Privacy Policy","home"],["Terms","home"]] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wide">{title}</h4>
            <ul className="space-y-2.5">
              {links.map(([label, page]) => (
                <li key={label}>
                  <button onClick={() => onNavigate(page)} className="text-sm hover:text-emerald-400 transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <span>© {new Date().getFullYear()} NatureKart. All rights reserved.</span>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-stone-800 rounded-lg">🔒 SSL Secured</span>
          <span className="px-3 py-1 bg-stone-800 rounded-lg">✅ FSSAI Certified</span>
          <span className="px-3 py-1 bg-stone-800 rounded-lg">🌿 100% Organic</span>
        </div>
      </div>
    </div>
  </footer>
);

// ─── HOME PAGE EXPORT ─────────────────────────────────────────────────────────
// onNavigate(page) — "home" | "shop" | "product" | "ai"
// onViewProduct(product) — called when user clicks a product card
export default function NatureKartHome({ onNavigate, onViewProduct }) {
  return (
    <div className="font-sans antialiased bg-white">
      <Navbar />
      <Hero onNavigate={onNavigate} />
      <Categories onNavigate={onNavigate} />
      <FeaturedProducts onNavigate={onNavigate} onViewProduct={onViewProduct} />
      <AIBanner onNavigate={onNavigate} />
      <WhyUs />
      <Testimonials />
      <Newsletter />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}