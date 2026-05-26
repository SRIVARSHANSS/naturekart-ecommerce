import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

/* ── FadeUp ── */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ── Decorative gold line ── */
const GoldLine = () => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-px bg-gold/60" />
    <div className="w-1.5 h-1.5 bg-gold/60" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
  </div>
);

/* ── Sage field ── */
const SageField = ({ name, label, type = 'text', value, onChange, error, textarea }) => (
  <div>
    <label className="block text-[10px] font-sans font-medium text-[#F5F0E8]/40 mb-1.5 uppercase tracking-[0.2em]">
      {label}
    </label>
    {textarea ? (
      <textarea name={name} value={value} onChange={onChange} rows={4}
        className={`w-full px-4 py-3 bg-surface-light border text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/15 font-sans
          focus:outline-none resize-none transition-all duration-200
          ${error ? 'border-red-500/40 focus:border-red-400/60' : 'border-gold/15 focus:border-gold/45 hover:border-gold/25'}`}
        placeholder="Your message…"
      />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange}
        className={`w-full px-4 py-3 bg-surface-light border text-sm text-[#F5F0E8] placeholder-[#F5F0E8]/15 font-sans
          focus:outline-none transition-all duration-200
          ${error ? 'border-red-500/40 focus:border-red-400/60' : 'border-gold/15 focus:border-gold/45 hover:border-gold/25'}`}
        placeholder={label.replace(' *', '')}
      />
    )}
    {error && <p className="text-red-400/70 text-xs mt-1.5">{error}</p>}
  </div>
);

/* ── Contact data ── */
const CONTACT_INFO = [
  {
    sym: '◎', title: 'Email',
    value: 'support@naturekart.com',
    link: 'mailto:support@naturekart.com',
  },
  {
    sym: '◈', title: 'Phone',
    value: '+91 98765 43210',
    link: 'tel:+919876543210',
  },
  {
    sym: '◇', title: 'Location',
    value: 'Madurai, Tamil Nadu, India',
    link: null,
  },
];

const SOCIAL = [
  { label: 'In', href: 'https://instagram.com' },
  { label: 'Li', href: 'https://linkedin.com' },
  { label: 'Tw', href: 'https://twitter.com' },
  { label: 'Yt', href: 'https://youtube.com' },
];

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
    setToast('Message sent — we\'ll reply within 24 hours.');
    setTimeout(() => setToast(''), 5000);
  };

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -32 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -32 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 border border-gold/30 bg-surface text-gold/80
              px-6 py-3 text-xs tracking-[0.15em] uppercase shadow-xl">
            ✦ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/4 blur-3xl pointer-events-none" />

        {/* Floating leaves */}
        {[
          { left: '10%', top: '30%', size: 30 }, { left: '85%', top: '25%', size: 22 },
          { left: '20%', top: '65%', size: 18 }, { left: '75%', top: '60%', size: 26 },
        ].map((pos, i) => (
          <motion.div key={i} className="absolute pointer-events-none opacity-5"
            style={{ left: pos.left, top: pos.top }}
            animate={{ y: [-6, 6, -6], rotate: [-3, 3, -3] }}
            transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: 'easeInOut' }}>
            <svg width={pos.size} height={pos.size * 1.6} viewBox="0 0 14 22" fill="none">
              <path d="M7 21C7 21 2 14 2 8C2 4 4 1 7 1C10 1 12 4 12 8C12 14 7 21 7 21Z"
                stroke="#C9A84C" strokeWidth="1" fill="#C9A84C" fillOpacity="0.3"/>
              <line x1="7" y1="2" x2="7" y2="20" stroke="#C9A84C" strokeWidth="0.5"/>
            </svg>
          </motion.div>
        ))}

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <p className="text-gold/60 text-xs tracking-[0.4em] uppercase font-sans mb-4 italic">— Get In Touch</p>
            <h1 className="font-serif text-5xl sm:text-6xl text-[#F5F0E8] leading-tight mb-4">
              We'd love to hear<br />
              <span className="text-gold italic">from you</span>
            </h1>
            <div className="w-16 h-px bg-gold/40 mx-auto mb-5" />
            <p className="text-[#F5F0E8]/40 text-base max-w-md mx-auto leading-relaxed">
              Our team is always here to assist. Send us a message and we'll respond within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FORM + INFO ── */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">

          {/* Contact Form */}
          <FadeUp>
            <div className="bg-surface border border-gold/15 p-8 relative">
              <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/40 pointer-events-none" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-gold/40 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-gold/40 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/40 pointer-events-none" />

              <GoldLine />
              <h2 className="font-serif text-2xl text-[#F5F0E8] mb-1">Send a Message</h2>
              <p className="text-[#F5F0E8]/30 text-xs mb-8 tracking-wider">We reply within 24 business hours</p>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-14">
                    {/* SVG check */}
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-6">
                      <motion.circle cx="28" cy="28" r="26" stroke="#C9A84C" strokeWidth="1" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                      <motion.path d="M16 28L24 36L40 20" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.9 }} />
                    </svg>
                    <h3 className="font-serif text-xl text-[#F5F0E8] mb-2">Message Received</h3>
                    <p className="text-[#F5F0E8]/40 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                      Thank you for reaching out. We'll get back to you shortly.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { setSubted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                      className="px-8 py-3 border border-gold/30 text-gold/70 hover:text-gold hover:border-gold/60 text-xs tracking-[0.2em] uppercase transition-all">
                      Send Another
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <SageField name="name"  label="Full Name *"      value={form.name}  onChange={handleChange} error={errors.name} />
                      <SageField name="email" label="Email Address *"  value={form.email} onChange={handleChange} error={errors.email} type="email" />
                    </div>
                    <SageField name="subject" label="Subject"          value={form.subject} onChange={handleChange} />
                    <SageField name="message" label="Your Message *"   value={form.message} onChange={handleChange} error={errors.message} textarea />

                    <motion.button type="submit"
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      disabled={submitting}
                      className="w-full py-4 bg-gold hover:bg-gold/90 text-bg font-bold text-xs tracking-[0.2em] uppercase transition-all shimmer-btn-glow disabled:opacity-60 flex items-center justify-center gap-3">
                      {submitting ? (
                        <>
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            className="block w-4 h-4 border border-bg/30 border-t-bg rounded-full" />
                          Sending…
                        </>
                      ) : 'Send Message →'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </FadeUp>

          {/* Contact Details */}
          <div className="space-y-6">
            {/* Info cards */}
            <FadeUp>
              <div className="mb-6">
                <GoldLine />
                <h2 className="font-serif text-2xl text-[#F5F0E8]">Contact Details</h2>
              </div>
              <div className="space-y-3">
                {CONTACT_INFO.map(({ sym, title, value, link }, i) => (
                  <motion.div key={title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 4, borderColor: 'rgba(201,168,76,0.3)' }}
                    className="flex items-center gap-4 border border-gold/10 bg-surface p-4 transition-all duration-200">
                    <div className="w-10 h-10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-serif text-base">{sym}</span>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-0.5">{title}</p>
                      {link ? (
                        <a href={link} className="text-[#F5F0E8]/70 text-sm hover:text-gold transition-colors">
                          {value}
                        </a>
                      ) : (
                        <p className="text-[#F5F0E8]/70 text-sm">{value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeUp>

            {/* Hours */}
            <FadeUp delay={0.1}>
              <div className="border border-gold/10 bg-surface p-5 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold/25" />
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-4">Business Hours</p>
                {[['Mon – Sat', '9:00 AM – 6:00 PM', true], ['Sunday', 'Closed', false]].map(([day, time, open]) => (
                  <div key={day} className="flex items-center justify-between py-2.5 border-b border-gold/8 last:border-0">
                    <span className="text-xs text-[#F5F0E8]/50">{day}</span>
                    <span className={`text-xs font-medium ${open ? 'text-gold/70' : 'text-[#F5F0E8]/25'}`}>{time}</span>
                  </div>
                ))}
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
                  <p className="text-[10px] text-[#F5F0E8]/25 tracking-wider">Usually replies within 24 hours</p>
                </div>
              </div>
            </FadeUp>

            {/* Social */}
            <FadeUp delay={0.2}>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold/40 mb-4">Follow Us</p>
                <div className="flex gap-3">
                  {SOCIAL.map(({ label, href }) => (
                    <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, borderColor: 'rgba(201,168,76,0.6)' }} whileTap={{ scale: 0.95 }}
                      className="w-11 h-11 border border-gold/15 flex items-center justify-center
                        text-[#F5F0E8]/40 hover:text-gold text-xs font-sans tracking-wider transition-all">
                      {label}
                    </motion.a>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Location Strip ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <FadeUp>
          <div className="relative border border-gold/10 bg-surface overflow-hidden h-52 flex flex-col items-center justify-center">
            {/* background grid */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-gold/30" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-gold/30" />
            <div className="relative z-10 text-center">
              <span className="text-gold text-3xl block mb-2">◇</span>
              <p className="font-serif text-xl text-[#F5F0E8]/80">Madurai, Tamil Nadu, India</p>
              <p className="text-[#F5F0E8]/30 text-xs mt-1 tracking-wider">Serving across all of India</p>
              <motion.a
                href="https://maps.google.com/?q=Madurai,Tamil+Nadu"
                target="_blank" rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="inline-block mt-5 px-6 py-2 border border-gold/30 text-gold/70 hover:text-gold hover:border-gold/60 text-xs tracking-[0.2em] uppercase transition-all">
                Open in Maps →
              </motion.a>
            </div>
          </div>
        </FadeUp>
      </section>
    </div>
  );
}
