import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

/* ── Count-Up ── */
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
  }, [inView, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── FadeUp ── */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ── Data ── */
const FEATURES = [
  { icon: '○', title: '100% Organic',       desc: 'Every product is certified organic and free from harmful chemicals and synthetic additives.' },
  { icon: '◈', title: 'Lab Tested',          desc: 'All products undergo rigorous third-party lab testing for purity, potency, and safety.' },
  { icon: '◇', title: 'Fast Delivery',        desc: 'Pan-India delivery within 3–5 business days with real-time order tracking.' },
  { icon: '◆', title: 'No Chemicals',         desc: 'Zero synthetic preservatives, fillers, or artificial colourants — ever.' },
  { icon: '◉', title: 'AI Recommendations',  desc: 'Personalised health product suggestions powered by our intelligent wellness engine.' },
  { icon: '◎', title: 'Eco Packaging',        desc: 'All orders shipped in 100% biodegradable and recyclable packaging.' },
];

const TEAM = [
  { name: 'Sri Varshan S S', role: 'Founder & CEO',    initial: 'S', bio: 'Passionate about making natural wellness accessible for every household in India.' },
  { name: 'Priya Menon',     role: 'Head of Products', initial: 'P', bio: 'Ayurvedic expert with 10+ years of experience sourcing the finest herbs and botanicals.' },
  { name: 'Arjun Nair',      role: 'Tech Lead',         initial: 'A', bio: 'Building the technology that powers real-time personalised wellness experiences.' },
];

const STATS = [
  { value: 60,   suffix: '+', label: 'Premium Products' },
  { value: 2500, suffix: '+', label: 'Happy Customers'  },
  { value: 4.8,  suffix: '★', label: 'Average Rating'   },
  { value: 15,   suffix: '+', label: 'States Delivered'  },
];

/* ── Decorative line ── */
const GoldLine = () => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-px bg-gold/60" />
    <div className="w-1.5 h-1.5 bg-gold/60" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
  </div>
);

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image - clear and fully visible */}
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none" 
          style={{ backgroundImage: "url('/images/about_hero_bg.png')", opacity: 1 }} 
        />
        {/* Light dark overlay to keep text readable */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(13,13,11,0.35) 0%, rgba(13,13,11,0.25) 60%, rgba(13,13,11,0.45) 100%)' }} />

        {/* background texture lines */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        {/* Floating botanical leaves */}
        {[
          { left: '8%', top: '25%', size: 40 }, { left: '88%', top: '20%', size: 30 },
          { left: '15%', top: '70%', size: 24 }, { left: '80%', top: '65%', size: 35 },
          { left: '50%', top: '15%', size: 20 }, { left: '45%', top: '80%', size: 28 },
        ].map((pos, i) => (
          <motion.div key={i}
            className="absolute pointer-events-none opacity-5"
            style={{ left: pos.left, top: pos.top }}
            animate={{ y: [-8, 8, -8], rotate: [-4, 4, -4] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}>
            <svg width={pos.size} height={pos.size * 1.6} viewBox="0 0 14 22" fill="none">
              <path d="M7 21C7 21 2 14 2 8C2 4 4 1 7 1C10 1 12 4 12 8C12 14 7 21 7 21Z"
                stroke="#C9A84C" strokeWidth="1" fill="#C9A84C" fillOpacity="0.3"/>
              <line x1="7" y1="2" x2="7" y2="20" stroke="#C9A84C" strokeWidth="0.5"/>
            </svg>
          </motion.div>
        ))}

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <p className="text-gold/60 text-xs tracking-[0.4em] uppercase font-sans mb-4 italic">— Our Story</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-[#F5F0E8] leading-tight mb-6">
              About{' '}
              <span className="text-gold">NatureKart</span>
            </h1>
            <div className="w-16 h-px bg-gold/40 mx-auto mb-6" />
            <p className="text-[#F5F0E8]/50 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Empowering healthier lives with pure, natural, and organic products — rooted in Ayurvedic wisdom, delivered with modern care.
            </p>
            <motion.button onClick={() => navigate('/shop')}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-10 py-3.5 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.2em] uppercase transition-all shimmer-btn-glow">
              Explore Collection →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <GoldLine />
            <p className="text-xs tracking-[0.3em] uppercase text-gold/50 mb-4">Our Origin</p>
            <h2 className="font-serif text-4xl text-[#F5F0E8] leading-tight mb-6">
              Born from a belief in<br />
              <span className="text-gold italic">nature's healing power</span>
            </h2>
            <div className="space-y-4 text-[#F5F0E8]/50 leading-relaxed">
              <p>
                NatureKart began with a simple observation: millions of Indians were spending money on synthetic supplements and chemical-laden skincare while{' '}
                <span className="text-[#F5F0E8]/80">ancient, proven Ayurvedic remedies</span> sat untapped.
              </p>
              <p>
                Our founder Sri Varshan S S set out to bridge this gap — building a platform where every product is{' '}
                <span className="text-[#F5F0E8]/80">ethically sourced, rigorously tested</span>, and fairly priced so that wellness becomes a right, not a luxury.
              </p>
              <p>
                Today, NatureKart is a growing community of 2500+ health-conscious customers across India, united by a shared belief:{' '}
                <span className="text-gold italic">nature knows best</span>.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="relative">
              {/* Decorative frame */}
              <div className="border border-gold/15 p-8 bg-bigbox relative">
                <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/50" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/50" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-gold/50" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/50" />

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { sym: '✦', t: 'Organic',    d: 'Pure Sourcing' },
                    { sym: '◈', t: 'Lab Tested', d: 'Third-party'  },
                    { sym: '⌂', t: 'Himalayan',  d: 'Origin'       },
                    { sym: '◎', t: 'Eco Pack',   d: 'Zero Waste'   },
                  ].map(({ sym, t, d }) => (
                    <motion.div key={t} whileHover={{ scale: 1.03, borderColor: 'rgba(27, 54, 38, 0.3)' }}
                      className="border border-gold/10 bg-surface-light p-5 text-center transition-all duration-300">
                      <span className="text-gold text-2xl block mb-2">{sym}</span>
                      <p className="font-sans font-medium text-[#F5F0E8]/80 text-sm">{t}</p>
                      <p className="text-[10px] text-[#F5F0E8]/30 mt-0.5 tracking-wider">{d}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="border border-gold/20 bg-gold/5 p-4 text-center">
                  <p className="font-serif text-2xl text-gold">Since 2024</p>
                  <p className="text-[#F5F0E8]/30 text-xs mt-1 tracking-wider">Growing with you</p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── MISSION & VISION ── */}
      <section className="py-20 border-y border-gold/8 bg-bigbox relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <FadeUp className="text-center mb-14">
            <GoldLine />
            <p className="text-xs tracking-[0.3em] uppercase text-gold/50 mb-3">Mission & Vision</p>
            <h2 className="font-serif text-4xl text-[#F5F0E8]">What drives us forward</h2>
          </FadeUp>
          <div className="grid md:grid-cols-2 gap-6">
            {[{
              sym: '◎', label: 'Our Mission',
              text: 'To make pure, affordable, and effective natural wellness products accessible to every Indian household — replacing harmful chemicals with time-tested Ayurvedic wisdom.',
              points: ['Affordable organic pricing', 'No harmful additives', 'Pan-India accessibility'],
            }, {
              sym: '◈', label: 'Our Vision',
              text: "To become India's most trusted natural wellness marketplace — where technology and tradition unite to deliver personalised health solutions for every individual.",
              points: ['AI-powered personalisation', 'Trusted nationwide brand', 'Entire family wellness'],
            }].map(({ sym, label, text, points }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="border border-gold/15 bg-bg p-8 relative group transition-all duration-300">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/30 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/30 pointer-events-none" />
                <div className="text-gold text-3xl mb-5">{sym}</div>
                <h3 className="font-serif text-xl text-[#F5F0E8] mb-4">{label}</h3>
                <p className="text-[#F5F0E8]/40 text-sm leading-relaxed mb-6">{text}</p>
                <ul className="space-y-2">
                  {points.map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-[#F5F0E8]/50">
                      <span className="w-4 h-px bg-gold/50 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg to-surface opacity-80" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <FadeUp className="text-center mb-14">
            <GoldLine />
            <h2 className="font-serif text-4xl text-[#F5F0E8]">Numbers that speak</h2>
            <p className="text-[#F5F0E8]/40 mt-3 text-sm tracking-wide">Trust built over time, one botanical at a time</p>
          </FadeUp>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(({ value, suffix, label }, i) => (
              <FadeUp key={label} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4, borderColor: 'rgba(201,168,76,0.4)' }}
                  className="border border-gold/10 bg-bigbox p-6 text-center transition-all duration-300 relative">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/25" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold/25" />
                  <p className="font-serif text-4xl text-gold mb-1">
                    <CountUp target={parseFloat(value)} suffix={suffix} />
                  </p>
                  <p className="text-[#F5F0E8]/40 text-xs tracking-wider uppercase">{label}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <FadeUp className="text-center mb-14">
          <GoldLine />
          <p className="text-xs tracking-[0.3em] uppercase text-gold/50 mb-3">Why NatureKart</p>
          <h2 className="font-serif text-4xl text-[#F5F0E8]">Everything you need to thrive</h2>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, desc }, i) => (
            <FadeUp key={title} delay={i * 0.07}>
              <motion.div whileHover={{ y: -6, borderColor: 'rgba(201,168,76,0.35)' }}
                className="border border-gold/10 bg-bigbox p-7 relative group transition-all duration-300 cursor-default">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/20 pointer-events-none" />
                <div className="text-gold text-xl mb-5 font-serif">{icon}</div>
                <h3 className="font-sans font-semibold text-[#F5F0E8] text-base mb-2">{title}</h3>
                <p className="text-[#F5F0E8]/40 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-20 border-t border-gold/8">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <GoldLine />
            <p className="text-xs tracking-[0.3em] uppercase text-gold/50 mb-3">Our Team</p>
            <h2 className="font-serif text-4xl text-[#F5F0E8]">The people behind the mission</h2>
          </FadeUp>
          <div className="grid sm:grid-cols-3 gap-6">
            {TEAM.map(({ name, role, initial, bio }, i) => (
              <FadeUp key={name} delay={i * 0.12}>
                <motion.div whileHover={{ y: -6, borderColor: 'rgba(201,168,76,0.4)' }}
                  className="border border-gold/10 bg-bigbox p-8 text-center relative transition-all duration-300">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/25" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/25" />
                  <div className="w-16 h-16 border border-gold/30 bg-gold/5 flex items-center justify-center mx-auto mb-6">
                    <span className="font-serif text-2xl text-gold">{initial}</span>
                  </div>
                  <h3 className="font-serif text-lg text-[#F5F0E8] mb-1">{name}</h3>
                  <p className="text-gold/60 text-xs tracking-[0.15em] uppercase mb-4">{role}</p>
                  <p className="text-[#F5F0E8]/40 text-sm leading-relaxed">{bio}</p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-bigbox" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <motion.div
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gold blur-3xl pointer-events-none"
        />
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <FadeUp>
            <GoldLine />
            <h2 className="font-serif text-4xl sm:text-5xl text-[#F5F0E8] mb-4">
              Ready to start your<br />
              <span className="text-gold italic">wellness journey?</span>
            </h2>
            <p className="text-[#F5F0E8]/40 text-sm mb-10 max-w-md mx-auto leading-relaxed">
              Discover 60+ premium natural products, handpicked for your wellbeing.
            </p>
            <motion.button onClick={() => navigate('/shop')}
              whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(201,168,76,0.3)' }}
              whileTap={{ scale: 0.97 }}
              className="px-12 py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.2em] uppercase transition-all shimmer-btn-glow">
              Explore Products →
            </motion.button>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
