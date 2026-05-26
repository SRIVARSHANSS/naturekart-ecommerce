import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  const navigate = useNavigate();

  const shopLinks = [
    { label: "Herbal Products",   path: "/shop" },
    { label: "Organic Foods",     path: "/shop" },
    { label: "Skincare",          path: "/shop" },
    { label: "Herbal Tea",        path: "/shop" },
    { label: "Ayurveda",          path: "/shop" }
  ];

  const companyLinks = [
    { label: "About Us",          path: "/about" },
    { label: "Contact Us",        path: "/contact" },
    { label: "AI Health Desk",    path: "/ai-assistant" }
  ];

  const supportLinks = [
    { label: "Track Order",       path: "/order-tracking" },
    { label: "Returns & Refunds", path: "/profile" },
    { label: "Privacy Policy",    path: "/" },
    { label: "Terms of Service",  path: "/" }
  ];

  return (
    <footer className="relative bg-bg border-t border-gold/20 pt-16 pb-8 overflow-hidden">
      
      {/* Subtle Repeating SVG Botanical Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 5C35 15 25 25 30 35C25 25 15 35 30 5Z' fill='%23C9A84C'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <span className="text-bg text-base">🌿</span>
              </div>
              <span className="text-xl font-serif font-bold text-gold">Nature<span className="text-gold-light">Kart</span></span>
            </button>
            <p className="text-xs font-sans text-gold-dim leading-relaxed mb-5">
              India's premier botanical apothecary and organic marketplace. Handcrafted wellness, curated by science and nature.
            </p>
            <div className="flex gap-2">
              {["𝕏", "f", "in", "▶"].map((s) => (
                <motion.a 
                  key={s} 
                  href="#" 
                  whileHover={{ scale: 1.1, color: '#C9A84C', borderColor: '#C9A84C' }}
                  className="w-8 h-8 bg-surface-light border border-gold/10 rounded-md flex items-center justify-center text-xs text-gold-dim transition-all"
                >
                  {s}
                </motion.a>
              ))}
            </div>
          </div>

          {[
            { title: "Catalog", links: shopLinks },
            { title: "Bespoke", links: companyLinks },
            { title: "Support", links: supportLinks },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-gold font-sans font-bold mb-4 text-xs uppercase tracking-widest">{title}</h4>
              <ul className="space-y-2">
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <button 
                      onClick={() => navigate(path)} 
                      className="text-xs font-sans text-gold-dim hover:text-gold-light transition-colors duration-200"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="border-t border-gold/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-sans text-gold-dim uppercase tracking-wider">
          <span>© {new Date().getFullYear()} NatureKart. All rights reserved.</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="px-2.5 py-1 bg-surface-light border border-gold/10 rounded-sm">🔒 SSL Secured</span>
            <span className="px-2.5 py-1 bg-surface-light border border-gold/10 rounded-sm">🏆 FSSAI Approved</span>
            <span className="px-2.5 py-1 bg-surface-light border border-gold/10 rounded-sm">🌿 100% Organic</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
