import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart }    from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth }    from '../context/AuthContext.jsx';

/* ── Count-Up ──────────────────────────────────────────────────────────────── */
function CountUp({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Fade-Up ───────────────────────────────────────────────────────────────── */
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

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-stone-100' : 'bg-white/80 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
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
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50 transition-all">
            <span className="text-base">🛒</span>
            {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ── Data ──────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '🌿', title: '100% Organic',       desc: 'Every product is certified organic and free from harmful chemicals and synthetic additives.' },
  { icon: '🔬', title: 'Lab Tested',          desc: 'All products undergo rigorous third-party lab testing for purity, potency, and safety.' },
  { icon: '🚚', title: 'Fast Delivery',        desc: 'Pan-India delivery within 3–5 business days with real-time order tracking.' },
  { icon: '💚', title: 'No Chemicals',         desc: 'Zero synthetic preservatives, fillers, or artificial colourants — ever.' },
  { icon: '🤖', title: 'AI Recommendations',  desc: 'Personalised health product suggestions powered by our intelligent wellness engine.' },
  { icon: '♻️', title: 'Eco Packaging',       desc: 'All orders shipped in 100% biodegradable and recyclable packaging.' },
];

const TEAM = [
  { name: 'Sri Varshan S S', role: 'Founder & CEO', emoji: '👨‍💼', bio: 'Passionate about making natural wellness accessible for every household in India.' },
  { name: 'Priya Menon',     role: 'Head of Products', emoji: '👩‍🔬', bio: 'Ayurvedic expert with 10+ years of experience sourcing the finest herbs and botanicals.' },
  { name: 'Arjun Nair',      role: 'Tech Lead',    emoji: '👨‍💻', bio: 'Building the technology that powers real-time personalised wellness experiences.' },
];

const STATS = [
  { value: 60,   suffix: '+',  label: 'Premium Products', icon: '📦' },
  { value: 2500, suffix: '+',  label: 'Happy Customers',  icon: '😊' },
  { value: 4.8,  suffix: '★',  label: 'Average Rating',   icon: '⭐' },
  { value: 15,   suffix: '+',  label: 'States Delivered',  icon: '🚚' },
];

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans bg-white">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-green-400 blur-3xl -translate-x-1/2 -translate-y-1/3" />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 10, repeat: Infinity, delay: 3 }}
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-emerald-300 blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Floating emojis */}
        {['🌿','🍃','🌱','🌾','🪴','✨'].map((e, i) => (
          <motion.div key={i} className="absolute text-4xl opacity-20 pointer-events-none"
            style={{ left: `${8 + i * 16}%`, top: `${20 + (i % 3) * 20}%` }}
            animate={{ y: [-12, 12, -12], rotate: [-6, 6, -6] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}>
            {e}
          </motion.div>
        ))}

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-green-300 text-sm font-bold tracking-widest uppercase mb-6">
              🌿 Our Story
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
              About{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300">
                NatureKart
              </span>
            </h1>
            <p className="text-xl text-green-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Empowering healthier lives with pure, natural, and organic products — rooted in Ayurvedic wisdom, delivered with modern care.
            </p>
            <motion.button onClick={() => navigate('/shop')}
              whileHover={{ scale: 1.06, boxShadow: '0 20px 50px rgba(16,185,129,0.4)' }}
              whileTap={{ scale: 0.96 }}
              className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black rounded-2xl text-base shadow-xl">
              🛒 Explore Products
            </motion.button>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,80 C360,0 1080,80 1440,20 L1440,80 Z" />
          </svg>
        </div>
      </section>

      {/* ── OUR STORY ─────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <span className="inline-block text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">Our Story</span>
            <h2 className="text-4xl font-extrabold text-stone-800 mb-6 leading-tight">
              Born from a belief in<br />
              <span className="text-emerald-600">nature's healing power</span>
            </h2>
            <p className="text-stone-500 text-lg leading-relaxed mb-5">
              NatureKart began with a simple observation: millions of Indians were spending money on synthetic supplements and chemical-laden skincare while <strong className="text-stone-700">ancient, proven Ayurvedic remedies</strong> sat untapped.
            </p>
            <p className="text-stone-500 text-lg leading-relaxed mb-5">
              Our founder Sri Varshan S S set out to bridge this gap — building a platform where every product is <strong className="text-stone-700">ethically sourced, rigorously tested</strong>, and fairly priced so that wellness becomes a right, not a luxury.
            </p>
            <p className="text-stone-500 text-lg leading-relaxed">
              Today, NatureKart is a growing community of 2500+ health-conscious customers across India, united by a shared belief: <strong className="text-emerald-700">nature knows best</strong>.
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="relative">
              <div className="absolute inset-4 bg-gradient-to-br from-green-200 to-emerald-300 rounded-3xl blur-2xl opacity-40" />
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-10 border border-green-100">
                <div className="grid grid-cols-2 gap-6">
                  {[{ e: '🌿', t: 'Organic', d: 'Pure Sourcing' }, { e: '🔬', t: 'Lab Tested', d: 'Third-party' },
                    { e: '🏔️', t: 'Himalayan', d: 'Origin' }, { e: '♻️', t: 'Eco Pack', d: 'Zero Waste' }].map(({ e, t, d }) => (
                    <motion.div key={t} whileHover={{ scale: 1.05, y: -4 }}
                      className="bg-white rounded-2xl p-5 text-center shadow-md border border-green-50">
                      <span className="text-3xl block mb-2">{e}</span>
                      <p className="font-bold text-stone-800 text-sm">{t}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{d}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-5 text-white text-center">
                  <p className="text-2xl font-black">Since 2024</p>
                  <p className="text-green-200 text-sm mt-1">Growing with you</p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── MISSION & VISION ──────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="text-sm font-bold text-emerald-600 tracking-widest uppercase">Mission & Vision</span>
            <h2 className="text-4xl font-extrabold text-stone-800 mt-2">What drives us forward</h2>
          </FadeUp>
          <div className="grid md:grid-cols-2 gap-8">
            {[{
              icon: '🎯', label: 'Our Mission', color: 'from-green-600 to-emerald-600',
              text: 'To make pure, affordable, and effective natural wellness products accessible to every Indian household — replacing harmful chemicals with time-tested Ayurvedic wisdom.',
              points: ['Affordable organic pricing', 'No harmful additives', 'Pan-India accessibility'],
            }, {
              icon: '🔭', label: 'Our Vision', color: 'from-teal-600 to-cyan-600',
              text: 'To become India\'s most trusted natural wellness marketplace — where technology and tradition unite to deliver personalised health solutions for every individual.',
              points: ['AI-powered personalisation', 'Trusted nationwide brand', 'Entire family wellness'],
            }].map(({ icon, label, color, text, points }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: i === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-stone-100">
                <div className={`bg-gradient-to-br ${color} p-6`}>
                  <span className="text-4xl">{icon}</span>
                  <h3 className="text-xl font-extrabold text-white mt-3">{label}</h3>
                </div>
                <div className="p-6">
                  <p className="text-stone-500 leading-relaxed mb-5">{text}</p>
                  <ul className="space-y-2">
                    {points.map(p => (
                      <li key={p} className="flex items-center gap-2 text-sm text-stone-600 font-medium">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <FadeUp className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white">Numbers that speak</h2>
            <p className="text-green-200 mt-2">Trust built over time, one product at a time</p>
          </FadeUp>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(({ value, suffix, label, icon }, i) => (
              <FadeUp key={label} delay={i * 0.1}>
                <motion.div whileHover={{ y: -6, scale: 1.03 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                  <span className="text-3xl block mb-3">{icon}</span>
                  <p className="text-4xl font-black text-white">
                    <CountUp target={typeof value === 'number' ? value : parseFloat(value)} suffix={suffix} />
                  </p>
                  <p className="text-green-300 font-semibold mt-1 text-sm">{label}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ───────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <FadeUp className="text-center mb-16">
          <span className="text-sm font-bold text-emerald-600 tracking-widest uppercase">Why NatureKart</span>
          <h2 className="text-4xl font-extrabold text-stone-800 mt-2">Everything you need to thrive</h2>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc }, i) => (
            <FadeUp key={title} delay={i * 0.08}>
              <motion.div whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(16,185,129,0.12)' }}
                className="bg-white border border-stone-100 rounded-3xl p-7 shadow-sm cursor-default group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <h3 className="font-extrabold text-stone-800 text-lg mb-2">{title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-stone-50 to-green-50">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <span className="text-sm font-bold text-emerald-600 tracking-widest uppercase">Our Team</span>
            <h2 className="text-4xl font-extrabold text-stone-800 mt-2">The people behind the mission</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-3 gap-8">
            {TEAM.map(({ name, role, emoji, bio }, i) => (
              <FadeUp key={name} delay={i * 0.12}>
                <motion.div whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}
                  className="bg-white rounded-3xl p-8 text-center shadow-lg border border-stone-100">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-4xl mx-auto mb-5">
                    {emoji}
                  </div>
                  <h3 className="font-extrabold text-stone-800 text-lg">{name}</h3>
                  <p className="text-emerald-600 text-sm font-bold mt-1 mb-3">{role}</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{bio}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-green-800 to-emerald-900 relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-green-400 blur-3xl" />
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <FadeUp>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Ready to start your<br />wellness journey?</h2>
            <p className="text-green-200 text-lg mb-10">Discover 60+ premium natural products, handpicked for your wellbeing.</p>
            <motion.button onClick={() => navigate('/shop')}
              whileHover={{ scale: 1.06, boxShadow: '0 24px 60px rgba(16,185,129,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className="px-10 py-4 bg-white text-green-700 font-black rounded-2xl text-lg shadow-2xl hover:bg-green-50 transition-all">
              🌿 Explore Products →
            </motion.button>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-10 bg-stone-900 text-center">
        <p className="text-stone-400 text-sm">© 2024 NatureKart. Made with 💚 in India.</p>
      </footer>
    </div>
  );
}
