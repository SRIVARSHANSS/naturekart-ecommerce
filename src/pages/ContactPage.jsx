import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart }     from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth }     from '../context/AuthContext.jsx';

/* ── FadeUp ────────────────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { wishlist }  = useWishlist();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useState(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-stone-100' : 'bg-white/80 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <span className="text-lg">🌿</span>
          </div>
          <span className="text-xl font-black text-green-800">Nature<span className="text-emerald-500">Kart</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {[['/', 'Home'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']].map(([path, label]) => (
            <Link key={path} to={path} className="text-sm font-semibold text-stone-600 hover:text-green-700 transition-colors">{label}</Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <motion.button onClick={() => navigate('/wishlist')} whileHover={{ scale: 1.1 }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-red-500 hover:bg-red-50 transition-all">
            <span className="text-base">❤️</span>
            {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>}
          </motion.button>
          <motion.button onClick={() => navigate(isLoggedIn ? '/profile' : '/login')} whileHover={{ scale: 1.1 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50 transition-all overflow-hidden">
            {isLoggedIn ? (
              <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : <span className="text-base">👤</span>}
          </motion.button>
          <motion.button onClick={() => navigate('/cart')} whileHover={{ scale: 1.1 }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50">
            <span className="text-base">🛒</span>
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ── Contact Info ──────────────────────────────────────────────────────────── */
const CONTACT_INFO = [
  { icon: '📧', title: 'Email',    value: 'support@naturekart.com', link: 'mailto:support@naturekart.com' },
  { icon: '📱', title: 'Phone',    value: '+91 98765 43210',        link: 'tel:+919876543210' },
  { icon: '📍', title: 'Location', value: 'Madurai, Tamil Nadu, India', link: null },
];

const SOCIAL = [
  { icon: '📸', label: 'Instagram', href: 'https://instagram.com', color: 'hover:bg-pink-500' },
  { icon: '💼', label: 'LinkedIn',  href: 'https://linkedin.com',  color: 'hover:bg-blue-600' },
  { icon: '🐦', label: 'Twitter',   href: 'https://twitter.com',   color: 'hover:bg-sky-500' },
  { icon: '▶️', label: 'YouTube',   href: 'https://youtube.com',   color: 'hover:bg-red-500' },
];

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function ContactPage() {
  const navigate = useNavigate();

  const [form, setForm]        = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors]    = useState({});
  const [submitting, setSubm]  = useState(false);
  const [submitted, setSubted] = useState(false);
  const [toast, setToast]      = useState('');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSubm(true);
    await new Promise(r => setTimeout(r, 1600));
    setSubm(false); setSubted(true);
    setToast('✅ Message sent! We\'ll reply within 24 hours.');
    setTimeout(() => setToast(''), 5000);
  };

  const InputField = ({ name, label, type = 'text', textarea = false }) => {
    const [focused, setFocused] = useState(false);
    const hasValue = form[name];
    const up = focused || hasValue;
    const El = textarea ? 'textarea' : 'input';
    return (
      <div className="relative">
        <motion.label htmlFor={name}
          animate={{ top: up ? (textarea ? '10px' : '8px') : (textarea ? '18px' : '50%'), fontSize: up ? '10px' : '14px', color: up ? '#10b981' : '#a8a29e' }}
          transition={{ duration: 0.18 }}
          style={{ position: 'absolute', left: '16px', translateY: up ? '0%' : '-50%', pointerEvents: 'none', fontWeight: 700, zIndex: 1 }}>
          {label}
        </motion.label>
        <El
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={textarea ? 4 : undefined}
          className={`w-full ${textarea ? 'pt-8 pb-3' : 'pt-7 pb-2'} px-4 rounded-xl border-2 text-sm bg-white transition-all outline-none resize-none
            ${focused ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]' : 'border-stone-200'}
            ${errors[name] ? 'border-red-400' : ''}`}
        />
        {errors[name] && <p className="text-red-500 text-xs mt-1 ml-1">{errors[name]}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans bg-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-green-400 blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-5 py-2 bg-white/10 border border-white/20 rounded-full text-green-300 text-sm font-bold tracking-widest uppercase mb-6">
              💬 Get In Touch
            </span>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-4">
              We'd love to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">hear from you</span>
            </h1>
            <p className="text-green-100/80 text-lg">Our friendly team is always here to chat. Send us a message!</p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C360,0 1080,60 1440,20 L1440,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FORM + INFO ───────────────────────────────────────────────────── */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-start">

          {/* Form */}
          <FadeUp>
            <div className="bg-white rounded-3xl border border-stone-100 shadow-xl p-8">
              <h2 className="text-2xl font-extrabold text-stone-800 mb-2">Send a Message</h2>
              <p className="text-stone-400 text-sm mb-7">We reply within 24 business hours.</p>

              {submitted ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12">
                  <div className="text-7xl mb-5">🎉</div>
                  <h3 className="text-2xl font-extrabold text-stone-800 mb-2">Message Sent!</h3>
                  <p className="text-stone-400 mb-6">We'll get back to you within 24 hours.</p>
                  <motion.button whileHover={{ scale: 1.04 }} onClick={() => { setSubted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm">
                    Send Another
                  </motion.button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InputField name="name"  label="Your Name *" />
                    <InputField name="email" label="Email Address *" type="email" />
                  </div>
                  <InputField name="subject" label="Subject" />
                  <InputField name="message" label="Your Message *" textarea />
                  <motion.button type="submit" whileHover={{ scale: 1.02, boxShadow: '0 16px 40px rgba(16,185,129,0.3)' }}
                    whileTap={{ scale: 0.97 }} disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-green-100 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                        Sending…
                      </>
                    ) : '📨 Send Message'}
                  </motion.button>
                </form>
              )}
            </div>
          </FadeUp>

          {/* Contact Details */}
          <div className="space-y-6">
            {/* Info Cards */}
            <FadeUp>
              <h2 className="text-2xl font-extrabold text-stone-800 mb-6">Contact Details</h2>
              <div className="space-y-4">
                {CONTACT_INFO.map(({ icon, title, value, link }, i) => (
                  <motion.div key={title} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
                    className="flex items-center gap-4 bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">{title}</p>
                      {link ? (
                        <a href={link} className="text-stone-700 font-semibold text-sm hover:text-emerald-600 transition-colors">{value}</a>
                      ) : (
                        <p className="text-stone-700 font-semibold text-sm">{value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeUp>

            {/* Business Hours */}
            <FadeUp delay={0.1}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🕐</span>
                  <h3 className="font-extrabold text-stone-800">Business Hours</h3>
                </div>
                {[['Mon – Sat', '9:00 AM – 6:00 PM', true], ['Sunday', 'Closed', false]].map(([day, time, open]) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-green-100 last:border-0">
                    <span className="text-sm text-stone-600 font-medium">{day}</span>
                    <span className={`text-sm font-bold ${open ? 'text-emerald-600' : 'text-red-400'}`}>{time}</span>
                  </div>
                ))}
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs text-stone-400">Usually replies within 24 hours</p>
                </div>
              </div>
            </FadeUp>

            {/* Social */}
            <FadeUp delay={0.2}>
              <h3 className="font-extrabold text-stone-800 mb-4">Follow Us</h3>
              <div className="flex gap-3">
                {SOCIAL.map(({ icon, label, href, color }) => (
                  <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center text-xl transition-all ${color} hover:text-white`}
                    title={label}>
                    {icon}
                  </motion.a>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── MAP PLACEHOLDER ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <FadeUp>
          <div className="relative bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl overflow-hidden h-64 border border-green-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-3">📍</span>
            <p className="font-extrabold text-stone-700 text-lg">Madurai, Tamil Nadu, India</p>
            <p className="text-stone-400 text-sm mt-1">Serving across all of India</p>
            <motion.a href="https://maps.google.com/?q=Madurai,Tamil+Nadu" target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
              className="mt-5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all">
              Open in Maps →
            </motion.a>
          </div>
        </FadeUp>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-stone-900 text-center">
        <p className="text-stone-400 text-sm">© 2024 NatureKart. Made with 💚 in India.</p>
      </footer>
    </div>
  );
}
