import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useCart }     from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth }     from "../context/AuthContext.jsx";
import { useProducts } from "../hooks/useProducts.js";

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

const Stars = ({ rating, interactive = false, onRate }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <motion.span key={s} whileHover={interactive ? { scale: 1.3 } : {}}
        onClick={() => interactive && onRate && onRate(s)}
        className={`${interactive ? "cursor-pointer" : ""} text-lg ${s <= Math.round(rating) ? "text-amber-400" : "text-stone-200"}`}>
        ★
      </motion.span>
    ))}
  </div>
);

// ─── Full Product Catalogue (60 Products) ────────────────────────────────────────
import { ALL_PRODUCTS as BASE_PRODUCTS } from "../data/products.js";

const DETAILED_OVERRIDES = {
  1: { images: ["/images/ashwagandha.png", "/images/triphala.png", "/images/moringa.png"], qty: 60, unit: "grams", benefits: ["Reduces stress & anxiety by 44%", "Improves strength & endurance", "Supports healthy thyroid function", "Enhances cognitive function & memory", "Boosts testosterone & male vitality"], ingredients: ["KSM-66 Ashwagandha Root Extract 500mg", "Black Pepper Extract (Piperine) 5mg", "Organic Rice Flour (filler)", "Vegetable Capsule Shell"], usage: ["Take 1–2 capsules daily after meals", "Best taken with warm milk or water", "Use consistently for 8–12 weeks for optimal results", "Avoid if pregnant or breastfeeding"], aiReason: "Ashwagandha is a top adaptogen for stress, low energy, and hormonal balance. Based on your interest in wellness, this root extract directly targets cortisol regulation while supporting adrenal health — making it ideal for modern high-stress lifestyles.", aiTags: ["Stress Relief", "Energy Boost", "Hormonal Balance", "Adaptogen"] },
  2: { images: ["/images/turmeric.png", "/images/moringa.png", "/images/ashwagandha.png"], qty: 60, unit: "capsules", benefits: ["Powerful anti-inflammatory action", "Supports joint health & mobility", "Rich in antioxidants", "Aids digestion & gut health", "Supports healthy liver function"], ingredients: ["Turmeric Root Extract (95% curcuminoids) 500mg", "BioPerine® Black Pepper 5mg", "Ginger Root Extract 50mg", "Vegetable Capsule"], usage: ["Take 2 capsules daily with meals", "Pair with a healthy fat for best absorption", "Consistent use for 4+ weeks recommended"], aiReason: "Curcumin in turmeric is one of the most researched anti-inflammatory compounds. It's ideal for joint pain, gut inflammation, and oxidative stress — combined with BioPerine® for superior bioavailability.", aiTags: ["Anti-Inflammatory", "Joint Health", "Antioxidant", "Gut Health"] },
  3: { images: ["/images/moringa.png", "/images/ashwagandha.png", "/images/turmeric.png"], qty: 100, unit: "grams", benefits: ["92+ essential nutrients in one dose", "Rich in iron — fights anaemia", "Powerful detoxification support", "Supports healthy blood sugar", "Complete plant-based protein source"], ingredients: ["Organic Moringa Oleifera Leaf Powder 100%", "No additives, fillers, or preservatives"], usage: ["Add 1 tsp to smoothies, juices or warm water", "Mix into yoghurt or oatmeal", "Start with half teaspoon and build up gradually"], aiReason: "Moringa is the most nutrient-dense plant on Earth. For anyone focused on nutrition, immunity, or iron intake — moringa delivers more vitamin C than oranges, more calcium than milk, and more protein than eggs per gram.", aiTags: ["Superfood", "Iron Rich", "Immunity", "Detox"] },
  4: { images: ["/images/neem-facewash.png", "/images/rosehip.png", "/images/moringa.png"], qty: 100, unit: "ml", benefits: ["Fights acne & pimple-causing bacteria", "Unclogs pores and removes excess oil", "Anti-bacterial & anti-fungal properties", "Suitable for sensitive skin", "Reduces blackheads & whiteheads"], ingredients: ["Neem Leaf Extract", "Tea Tree Essential Oil", "Aloe Vera Gel", "Glycerin", "Vitamin E", "Aqua"], usage: ["Apply to wet face & neck", "Massage gently in circular motions for 60 seconds", "Rinse thoroughly with lukewarm water", "Use twice daily for best results"], aiReason: "Neem has been used in Ayurveda for over 4000 years as a natural antibiotic for skin. Combined with tea tree oil, this face wash targets acne at the root — without the harsh dryness of chemical alternatives.", aiTags: ["Anti-Acne", "Pore Care", "Natural Cleanser", "Sensitive Skin"] },
  5: { images: ["/images/triphala.png", "/images/ashwagandha.png", "/images/moringa.png"], qty: 100, unit: "grams", benefits: ["Gently relieves constipation", "Supports healthy gut microbiome", "Natural full-body detox", "Rich in vitamin C (Amalaki)", "Supports eye health"], ingredients: ["Amalaki (Emblica officinalis) 33.3%", "Bibhitaki (Terminalia bellirica) 33.3%", "Haritaki (Terminalia chebula) 33.3%"], usage: ["Mix 1 tsp in warm water at bedtime", "Or take with honey in the morning", "Start with a smaller dose and increase gradually", "Not recommended during pregnancy"], aiReason: "Triphala is a cornerstone Ayurvedic formula with clinical evidence supporting its use for IBS, constipation, and gut microbiome health. It gently cleanses without dependency — unlike conventional laxatives.", aiTags: ["Digestive Health", "Detox", "Gut Microbiome", "Ayurvedic"] },
  6: { images: ["/images/rosehip.png", "/images/neem-facewash.png", "/images/moringa.png"], qty: 30, unit: "ml", benefits: ["Reduces scars & stretch marks", "Fades hyperpigmentation & dark spots", "Deep hydration without greasiness", "Anti-ageing vitamin A & C rich", "Improves skin texture & elasticity"], ingredients: ["Rosa Canina (Rosehip) Seed Oil 100%", "Cold-pressed, unrefined, hexane-free"], usage: ["Apply 3–4 drops to clean face & neck", "Gently massage until absorbed", "Use morning and evening", "Can be layered under moisturiser"], aiReason: "Rosehip oil's natural trans-retinoic acid (vitamin A) is clinically proven to reduce fine lines and scars. It's a rare plant oil that combines anti-ageing, brightening, and hydrating benefits — without synthetic retinoids.", aiTags: ["Anti-Ageing", "Brightening", "Scar Reduction", "Luxury Skincare"] },
  7: { images: ["/images/tulsi-tea.png", "/images/moringa.png", "/images/ashwagandha.png"], qty: 25, unit: "bags", benefits: ["Strengthens immune system", "Reduces stress & mental fatigue", "Rich in antioxidants & polyphenols", "Supports respiratory health", "Light caffeine — no jitters"], ingredients: ["Organic Tulsi (Holy Basil) Leaves", "Organic Green Tea Leaves", "Natural Lemon Essence"], usage: ["Steep 1 bag in 200ml hot water (85°C) for 2–3 mins", "Do not over-brew to avoid bitterness", "Enjoy 2–3 cups daily", "Add honey or lemon to taste"], aiReason: "Tulsi is revered as the 'Queen of Herbs' in Ayurveda for its adaptogenic and antimicrobial properties. Combined with green tea's EGCG antioxidants, this blend delivers calm energy and immune support in every cup.", aiTags: ["Immunity", "Stress Relief", "Antioxidant", "Caffeine-Light"] },
  8: { images: ["/images/amla-serum.png", "/images/rosehip.png", "/images/neem-facewash.png"], qty: 50, unit: "ml", benefits: ["Reduces hair fall by up to 47%", "Stimulates new hair follicle growth", "Strengthens hair from the root", "Adds natural shine & lustre", "Nourishes dry, damaged scalp"], ingredients: ["Amla (Phyllanthus emblica) Extract", "Bhringraj Extract", "Redensyl® 3%", "Biotin", "Argan Oil", "Keratin Proteins"], usage: ["Apply 4–6 drops to scalp on damp hair", "Massage gently for 2 minutes", "Leave in — do not rinse", "Use daily for best results"], aiReason: "Amla has the highest natural vitamin C content of any fruit and is scientifically validated for hair growth. Paired with Redensyl® — a clinically proven alternative to minoxidil — this serum addresses hair thinning at the follicular level.", aiTags: ["Hair Growth", "Hair Fall", "Scalp Health", "Strengthening"] },
};

const enrichProduct = (p) => {
  if (!p) return null;
  const pid = typeof p.id === 'number' ? p.id : null;
  if (pid && DETAILED_OVERRIDES[pid]) {
    return { ...p, mrp: p.price + Math.round(p.price * 0.25), ...DETAILED_OVERRIDES[pid] };
  }
  return {
    ...p,
    mrp: p.price + Math.round(p.price * 0.25),
    images: [p.image, "/images/moringa.png", "/images/ashwagandha.png"],
    qty: 1,
    unit: "pack",
    benefits: ["100% natural and organic ingredients", "No artificial preservatives or fillers", "Sustainably and ethically sourced", "Carefully tested for purity and quality", "Supports overall well-being and health"],
    ingredients: [`Premium ${p.name} Extract 100%`],
    usage: ["Use as directed on the packaging", "Store in a cool, dry place away from sunlight", "Consult a healthcare professional if unsure"],
    aiReason: p.aiReason || `${p.name} is an excellent natural wellness product aligned with holistic health practices.`,
    aiTags: ["Organic", "Natural", "Wellness", "Authentic"]
  };
};

const RELATED_PLACEHOLDER = BASE_PRODUCTS.slice(0, 5).map(p => enrichProduct({ ...p, id: p.id }));

const tagColors = {
  Bestseller: "bg-amber-100 text-amber-700 border-amber-200",
  New:        "bg-blue-100 text-blue-700 border-blue-200",
  "Top Rated":"bg-green-100 text-green-700 border-green-200",
  Premium:    "bg-purple-100 text-purple-700 border-purple-200",
  Sale:       "bg-red-100 text-red-700 border-red-200",
};

const REVIEWS = [
  { name: "Priya Sharma",    rating: 5, date: "March 2024",  text: "Absolutely love this product! I've been using it for 3 months and the difference is incredible. Genuine quality, fast delivery. Will definitely repurchase!", role: "Verified Buyer", helpful: 47 },
  { name: "Rajan Mehta",    rating: 5, date: "Feb 2024",    text: "The AI recommendation on the site suggested this for my stress issues and it's been a game-changer. Feel calmer and more focused every day.", role: "Verified Buyer", helpful: 33 },
  { name: "Kavya Nair",     rating: 4, date: "Jan 2024",    text: "Good quality product. Packaging is premium and delivery was quick. Noticed results after 4-5 weeks. Slightly expensive but worth it.", role: "Verified Buyer", helpful: 21 },
  { name: "Arjun Reddy",   rating: 5, date: "Dec 2023",    text: "Been taking this for 2 months. My energy levels are through the roof and I sleep so much better. 100% authentic product.", role: "Verified Buyer", helpful: 38 },
];

// ─── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { wishlist }  = useWishlist();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <motion.nav initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-lg border-b border-green-100" : "bg-white border-b border-stone-100"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.button onClick={() => navigate("/")} whileHover={{ scale: 1.04 }} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md shadow-green-300/40">
              <span className="text-white text-base">🌿</span>
            </div>
            <span className="text-lg font-bold text-green-800 tracking-tight">Nature<span className="text-emerald-500">Kart</span></span>
          </motion.button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-stone-400">
            <button onClick={() => navigate("/")} className="hover:text-green-700 font-medium transition-colors">Home</button>
            <span>/</span>
            <button onClick={() => navigate("/shop")} className="hover:text-green-700 font-medium transition-colors">Shop</button>
            <span>/</span>
            <span className="text-stone-600 font-semibold">Product Details</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <motion.button onClick={() => navigate("/wishlist")}
              whileHover={{ scale: 1.1 }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-red-500 hover:bg-red-50 transition-all">
              <span className="text-base">❤️</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{wishlist.length}</span>
              )}
            </motion.button>
            {/* Profile / Sign In */}
            <motion.button onClick={() => navigate(isLoggedIn ? "/profile" : "/login")}
              whileHover={{ scale: 1.1 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-green-700 hover:bg-green-50 transition-all overflow-hidden">
              {isLoggedIn ? (
                <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              ) : (
                <span className="text-base">👤</span>
              )}
            </motion.button>
            {/* Cart */}
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

// ─── Image Gallery ─────────────────────────────────────────────────────────────
const ImageGallery = ({ images, productName }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-50 to-green-50 border border-stone-100 aspect-square cursor-zoom-in"
        onClick={() => setZoomed(!zoomed)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={images[activeIdx]}
            alt={productName}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: zoomed ? 1.15 : 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </AnimatePresence>

        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/30 backdrop-blur-sm text-white text-[10px] font-semibold rounded-lg opacity-0 hover:opacity-100 transition-opacity">
          {zoomed ? "Click to zoom out" : "Click to zoom in"}
        </div>

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <motion.button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + images.length) % images.length); }}
              whileHover={{ scale: 1.1 }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-xl shadow-md flex items-center justify-center text-stone-600 hover:text-green-700">
              ←
            </motion.button>
            <motion.button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % images.length); }}
              whileHover={{ scale: 1.1 }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-xl shadow-md flex items-center justify-center text-stone-600 hover:text-green-700">
              →
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Thumbnails */}
      <div className="flex gap-3">
        {images.map((img, i) => (
          <motion.button
            key={i}
            onClick={() => setActiveIdx(i)}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
            className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
              activeIdx === i ? "border-green-500 shadow-md shadow-green-200" : "border-stone-200 hover:border-green-300"
            }`}
          >
            <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.opacity = "0.3"; }} />
            {activeIdx === i && <div className="absolute inset-0 bg-green-500/10" />}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ─── AI Recommendation Box ─────────────────────────────────────────────────────
const AIRecommendationBox = ({ product }) => (
  <FadeUp delay={0.1}>
    <div className="relative overflow-hidden rounded-2xl">
      {/* Animated border */}
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 p-px">
        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-green-950 to-emerald-950" />
      </motion.div>

      <div className="relative bg-gradient-to-br from-green-950 to-emerald-950 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-10 h-10 bg-green-400/20 border border-green-400/30 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </motion.div>
          <div>
            <div className="text-green-300 font-extrabold text-sm">Why This is Good for You</div>
            <div className="text-green-500 text-xs">AI-powered health insight</div>
          </div>
        </div>

        <p className="text-green-100/90 text-sm leading-relaxed mb-4">{product.aiReason}</p>

        <div className="flex flex-wrap gap-2">
          {product.aiTags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-green-400/15 border border-green-400/25 text-green-300 text-[10px] font-bold rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  </FadeUp>
);

// ─── Tabs Section ─────────────────────────────────────────────────────────────
const TABS = ["Benefits", "Ingredients", "How to Use"];

const TabsSection = ({ product }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabContent = [product.benefits, product.ingredients, product.usage];
  const tabIcons = ["✨", "🌿", "📋"];

  return (
    <FadeUp delay={0.05} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-stone-100 relative">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all relative ${
              activeTab === i ? "text-green-700" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <span className="mr-1.5">{tabIcons[i]}</span>
            {tab}
            {activeTab === i && (
              <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.ul
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {tabContent[activeTab].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-[10px] font-bold">✓</span>
                </span>
                <span className="text-stone-700 text-sm leading-relaxed">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </FadeUp>
  );
};

// ─── Reviews Section ───────────────────────────────────────────────────────────
const ReviewsSection = ({ product }) => {
  const [helpful, setHelpful] = useState({});
  const ratingDist = [5, 4, 3, 2, 1];
  const distValues = [68, 20, 8, 3, 1]; // %

  return (
    <FadeUp className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      <h3 className="font-extrabold text-stone-800 text-lg mb-6">Customer Reviews</h3>

      {/* Rating summary */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-stone-100">
        <div className="text-center flex-shrink-0">
          <div className="text-6xl font-extrabold text-stone-800">{product.rating}</div>
          <Stars rating={product.rating} />
          <div className="text-xs text-stone-400 mt-1">{product.reviews} reviews</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingDist.map((stars, i) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-stone-500 w-8 font-medium">{stars}★</span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${distValues[i]}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
              <span className="text-xs text-stone-400 w-8 font-medium">{distValues[i]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-5">
        {REVIEWS.map((review, i) => (
          <motion.div
            key={review.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 bg-stone-50 rounded-2xl border border-stone-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-lg font-bold text-green-600">
                  {review.name[0]}
                </div>
                <div>
                  <div className="font-bold text-stone-800 text-sm">{review.name}</div>
                  <div className="text-[10px] text-emerald-600 font-bold">{review.role}</div>
                </div>
              </div>
              <span className="text-xs text-stone-400">{review.date}</span>
            </div>
            <Stars rating={review.rating} />
            <p className="text-stone-600 text-sm leading-relaxed mt-3">{review.text}</p>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-stone-200">
              <span className="text-xs text-stone-400">Was this helpful?</span>
              <motion.button
                onClick={() => setHelpful((h) => ({ ...h, [i]: !h[i] }))}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  helpful[i] ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                👍 {helpful[i] ? review.helpful + 1 : review.helpful}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </FadeUp>
  );
};

// ─── Related Products Row ─────────────────────────────────────────────────────
const RelatedProducts = ({ currentId, onViewProduct }) => {
  const related = RELATED_PRODUCTS.filter((p) => p.id !== currentId);
  const scrollRef = useRef(null);

  return (
    <FadeUp className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase">You May Also Like</span>
          <h3 className="text-2xl font-extrabold text-stone-800 mt-1">Related Products</h3>
        </div>
        <div className="flex gap-2">
          {[-1, 1].map((dir) => (
            <motion.button key={dir} onClick={() => scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" })}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 bg-stone-100 hover:bg-green-100 rounded-xl flex items-center justify-center text-stone-600 hover:text-green-700 transition-all">
              {dir === -1 ? "←" : "→"}
            </motion.button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {related.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.10)" }}
            onClick={() => onViewProduct(product)}
            className="flex-shrink-0 w-52 bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer group"
          >
            <div className="overflow-hidden h-36 relative">
              <motion.img whileHover={{ scale: 1.08 }} transition={{ duration: 0.35 }}
                src={product.image} alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              {product.tag && (
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold rounded-full border ${tagColors[product.tag]}`}>{product.tag}</span>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-stone-800 text-xs leading-tight mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">{product.name}</p>
              <div className="flex items-center gap-0.5 mb-1">
                {[1,2,3,4,5].map((s) => <span key={s} className={`text-[10px] ${s <= Math.round(product.rating) ? "text-amber-400" : "text-stone-200"}`}>★</span>)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-extrabold text-green-700">₹{product.price}</span>
                <span className="text-[9px] text-stone-400 line-through">₹{product.mrp}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </FadeUp>
  );
};

// ─── MAIN PRODUCT DETAILS PAGE ────────────────────────────────────────────────
export default function ProductDetails({ onNavigate, onViewProduct }) {
  const navigate = useNavigate();
  const { id } = useParams();

  /* Fetch live products from DB; fall back to static while loading */
  const { products: liveProducts } = useProducts();
  const rawProduct = liveProducts.find(p => p._id === id || String(p.id) === String(id))
    || BASE_PRODUCTS.find(p => p.id === parseInt(id));
  const product = enrichProduct(rawProduct);

  const RELATED_PRODUCTS = liveProducts.length > 0
    ? liveProducts.slice(0, 5).map(p => enrichProduct(p))
    : RELATED_PLACEHOLDER;

  const [qty, setQty]             = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product?.id);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product);
      setBuyLoading(true);
      setTimeout(() => {
        setBuyLoading(false);
        navigate("/checkout");
      }, 1200);
    }
  };

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans antialiased">
      <Navbar />

      <div className="pt-16">
        {/* ── PRODUCT HERO ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Left — Image Gallery */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <ImageGallery images={product.images} productName={product.name} />
            </motion.div>

            {/* Right — Product Info */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-5">

              {/* Badge + Category */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase">{product.category}</span>
                {product.tag && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${tagColors[product.tag]}`}>{product.tag}</span>
                )}
                {product.inStock ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> In Stock
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-500">⚠ Out of Stock</span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 leading-tight tracking-tight">{product.name}</h1>

              {/* Rating row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Stars rating={product.rating} />
                <span className="text-stone-700 text-sm font-bold">{product.rating}</span>
                <span className="text-stone-400 text-sm">({product.reviews} verified reviews)</span>
                <motion.button whileHover={{ x: 3 }} onClick={() => {}} className="text-sm text-green-600 font-bold hover:text-green-800 transition-colors">
                  Write a review →
                </motion.button>
              </div>

              {/* Price block */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-extrabold text-green-700">₹{product.price}</span>
                <span className="text-xl text-stone-400 line-through font-medium">₹{product.mrp}</span>
                <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-extrabold rounded-xl">{discount}% OFF</span>
              </div>

              {/* Description */}
              <p className="text-stone-600 text-base leading-relaxed">{product.desc}</p>

              {/* Qty selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors font-bold text-lg">
                    −
                  </motion.button>
                  <span className="w-10 h-10 flex items-center justify-center font-extrabold text-stone-800">{qty}</span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors font-bold text-lg">
                    +
                  </motion.button>
                </div>
                <span className="text-xs text-stone-400">{product.qty}{product.unit && ` ${product.unit}`} per pack</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.03, boxShadow: "0 16px 32px rgba(16,185,129,0.30)" }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!product.inStock}
                  className={`flex-1 py-4 rounded-2xl text-base font-extrabold transition-all duration-300 flex items-center justify-center gap-2 ${
                    cartAdded
                      ? "bg-green-100 text-green-700 border-2 border-green-300"
                      : product.inStock
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-200/60"
                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  {cartAdded ? (
                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <span>✓</span> Added to Cart!
                    </motion.span>
                  ) : product.inStock ? "🛒 Add to Cart" : "Out of Stock"}
                </motion.button>

                <motion.button
                  onClick={handleBuyNow}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!product.inStock || buyLoading}
                  className="flex-1 py-4 rounded-2xl text-base font-extrabold bg-stone-900 hover:bg-stone-800 text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {buyLoading ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : "⚡ Buy Now"}
                </motion.button>

                <motion.button onClick={() => toggleWishlist(product)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-xl flex-shrink-0 transition-all ${
                    wished ? "border-red-300 bg-red-50 text-red-500" : "border-stone-200 hover:border-red-200 text-stone-400 hover:text-red-400"
                  }`}>
                  {wished ? "♥" : "♡"}
                </motion.button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: "🚚", title: "Free Delivery", sub: "Orders above ₹299" },
                  { icon: "↩️", title: "Easy Returns",  sub: "7-day return policy" },
                  { icon: "🔒", title: "Secure Payment", sub: "100% safe checkout" },
                ].map(({ icon, title, sub }) => (
                  <div key={title} className="flex flex-col items-center text-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-xl mb-1">{icon}</span>
                    <span className="text-[10px] font-extrabold text-stone-700">{title}</span>
                    <span className="text-[9px] text-stone-400">{sub}</span>
                  </div>
                ))}
              </div>

              {/* AI Box */}
              <AIRecommendationBox product={product} />
            </motion.div>
          </div>
        </div>

        {/* ── DETAILS TABS ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <FadeUp>
              <h2 className="text-2xl font-extrabold text-stone-800 mb-5">Product Details</h2>
              <TabsSection product={product} />
            </FadeUp>

            {/* Certifications */}
            <FadeUp delay={0.1}>
              <h2 className="text-2xl font-extrabold text-stone-800 mb-5">Certifications & Quality</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🌿", title: "100% Organic",     desc: "USDA & India Organic certified" },
                  { icon: "🏆", title: "FSSAI Certified",   desc: "Food Safety Standards Authority" },
                  { icon: "🔬", title: "Lab Tested",        desc: "Third-party purity verified" },
                  { icon: "🌱", title: "No Additives",      desc: "Zero preservatives or fillers" },
                  { icon: "♻️", title: "Eco Packaging",     desc: "100% recyclable materials" },
                  { icon: "🐾", title: "Cruelty Free",      desc: "Never tested on animals" },
                ].map(({ icon, title, desc }, i) => (
                  <motion.div key={title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(0,0,0,0.07)" }}
                    className="bg-white rounded-2xl border border-stone-100 p-4 flex items-start gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-bold text-stone-700 text-xs">{title}</div>
                      <div className="text-stone-400 text-[10px] mt-0.5">{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>

        {/* ── REVIEWS ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ReviewsSection product={product} />
        </div>

        {/* ── RELATED PRODUCTS ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <RelatedProducts currentId={product.id} onViewProduct={onViewProduct} />
        </div>
      </div>
    </div>
  );
}
