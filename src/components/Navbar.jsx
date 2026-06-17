import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart }     from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth }     from '../context/AuthContext.jsx';
import SearchOverlay   from './SearchOverlay.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlist }  = useWishlist();
  const { user, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Hidden admin entry: double-click the logo */
  const clickTimerRef = useRef(null);
  const handleLogoClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      navigate('/admin/dashboard');
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        navigate('/');
      }, 400);
    }
  };

  const baseLinks = [
    { label: "Home",         path: "/" },
    { label: "Shop",         path: "/shop" },
    { label: "About",        path: "/about" },
    { label: "Contact",      path: "/contact" },
    { label: "🤖 AI Health", path: "/ai-assistant", pill: true },
  ];

  const navLinks = isAdmin
    ? [
        ...baseLinks.slice(0, 4),
        { label: "⚙️ Admin", path: "/admin/dashboard" },
        ...baseLinks.slice(4)
      ]
    : baseLinks;

  // Pages that have a dark/video hero background — navbar should be white
  const darkHeroPages = ['/', '/shop', '/about', '/contact'];
  const isDarkBg = darkHeroPages.includes(location.pathname) && !scrolled;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDarkBg ? 'dark-section' : ''
      } ${
        scrolled
          ? "bg-bg/90 backdrop-blur-xl border-b border-gold/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <motion.button
            onClick={handleLogoClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 select-none"
          >
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-md shadow-gold/20">
              <span className="text-bg text-lg">🌿</span>
            </div>
            <span 
              className="logo-text text-xl font-serif font-bold tracking-tight transition-colors duration-200"
              style={{
                '--logo-color': isDarkBg ? '#F4F8F6' : '#1B3626',
                '--logo-accent-color': isDarkBg ? '#FFFFFF' : '#2D543B'
              }}
            >
              Nature<span className="logo-accent">Kart</span>
            </span>
          </motion.button>

          {/* Search bar */}
          <div className="hidden md:block flex-1 max-w-[280px] lg:max-w-[340px] mx-4">
            <SearchOverlay />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(({ label, path, pill }) => {
              const isActive = location.pathname === path;
              if (pill) {
                return (
                  <motion.button
                    key={label}
                    onClick={() => navigate(path)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="force-text-white ml-2 px-4 py-2 text-xs font-sans font-bold tracking-wider uppercase rounded-[2px] bg-gradient-to-r from-gold to-gold-light text-bg shadow-lg shadow-gold/20 shimmer-btn-glow"
                  >
                    {label}
                  </motion.button>
                );
              }
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="nav-link relative px-3.5 py-2 text-xs font-sans font-medium uppercase tracking-widest transition-colors duration-200 group"
                  style={{
                    '--nav-link-color': isDarkBg
                      ? (isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)')
                      : (isActive ? '#1B3626' : '#5C7C68'),
                    '--nav-link-hover-color': isDarkBg ? '#FFFFFF' : '#1B3626'
                  }}
                >
                  {label}
                  {/* Underline Hover transition */}
                  <span 
                    className={`absolute bottom-1.5 left-3.5 right-3.5 h-[1px] origin-left transition-transform duration-300 ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    style={{
                      backgroundColor: isDarkBg ? '#FFFFFF' : '#1B3626'
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Icon Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Wishlist */}
            <motion.button
              onClick={() => navigate("/wishlist")}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-md border border-gold/10 hover:border-gold/30 bg-surface-light flex items-center justify-center text-white/80 hover:text-white transition-colors duration-200"
              aria-label="Wishlist"
            >
              <span className="text-base">❤️</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-bg text-[9px] font-sans font-bold rounded-full flex items-center justify-center leading-none">
                  {wishlist.length}
                </span>
              )}
            </motion.button>

            {/* Profile */}
            <motion.button
              onClick={() => navigate(isLoggedIn ? "/profile" : "/login")}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-md border border-gold/10 hover:border-gold/30 bg-surface-light flex items-center justify-center text-white/80 hover:text-white transition-colors duration-200 overflow-hidden"
              aria-label="Profile"
            >
              {isLoggedIn ? (
                <div className="profile-initials w-full h-full bg-gold flex items-center justify-center font-bold text-xs font-sans">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              ) : (
                <span className="text-base">👤</span>
              )}
            </motion.button>

            {/* Cart */}
            <motion.button
              onClick={() => navigate("/cart")}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-md border border-gold/10 hover:border-gold/30 bg-surface-light flex items-center justify-center text-white/80 hover:text-white transition-colors duration-200"
              aria-label="Cart"
            >
              <span className="text-base">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-bg text-[9px] font-sans font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </motion.button>

            {/* Sign In CTA */}
            {!isLoggedIn && (
              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`ml-1 px-4 py-2 text-xs font-sans font-semibold tracking-widest uppercase rounded-[2px] bg-transparent transition-colors duration-200 ${
                  isDarkBg
                    ? "border border-white/40 text-white hover:bg-white/5 nav-link"
                    : "border border-gold/40 text-gold hover:bg-gold/5"
                }`}
                style={isDarkBg ? { '--nav-link-color': '#FFFFFF', '--nav-link-hover-color': '#FFFFFF' } : {}}
              >
                Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle Menu"
          >
            {["top", "mid", "bot"].map((pos) => (
              <span
                key={pos}
                className={`w-5 h-0.5 rounded bg-gold transition-all ${
                  pos === "top" && menuOpen ? "rotate-45 translate-y-2" : ""
                } ${pos === "mid" && menuOpen ? "opacity-0" : ""} ${
                  pos === "bot" && menuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            ))}
          </motion.button>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-0 top-16 bg-bg border-t border-gold/20 flex flex-col px-6 pt-8 z-40 overflow-y-auto"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map(({ label, path }) => (
                <button
                  key={label}
                  onClick={() => { navigate(path); setMenuOpen(false); }}
                  className="w-full text-left py-2 font-serif text-2xl tracking-wide text-white hover:text-gold transition-colors duration-200"
                >
                  {label}
                </button>
              ))}
              <div className="h-px bg-gold/10 my-4" />
              <div className="flex gap-4">
                <button
                  onClick={() => { navigate('/wishlist'); setMenuOpen(false); }}
                  className="flex-1 py-3 border border-gold/20 bg-bigbox text-gold font-sans font-bold tracking-widest text-xs uppercase rounded-[2px]"
                >
                  ❤️ Wishlist ({wishlist.length})
                </button>
                <button
                  onClick={() => { navigate('/cart'); setMenuOpen(false); }}
                  className="flex-1 py-3 border border-gold/20 bg-bigbox text-gold font-sans font-bold tracking-widest text-xs uppercase rounded-[2px]"
                >
                  🛒 Cart ({cartCount})
                </button>
              </div>
              {isLoggedIn ? (
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  className="force-text-white py-3.5 bg-gradient-to-r from-gold to-gold-light text-bg font-sans font-bold tracking-widest text-xs uppercase rounded-[2px] text-center"
                >
                  👤 My Profile ({user?.name})
                </button>
              ) : (
                <button
                  onClick={() => { navigate('/login'); setMenuOpen(false); }}
                  className="force-text-white py-3.5 bg-gradient-to-r from-gold to-gold-light text-bg font-sans font-bold tracking-widest text-xs uppercase rounded-[2px] text-center"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
