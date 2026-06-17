import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useCart }     from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth }     from "../context/AuthContext.jsx";
import { getProduct, getProducts } from "../services/api.js";
import Navbar from "../components/Navbar.jsx";

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

// ─── Full Product Catalogue (60 Products) ────────────────────────────────────────
import { ALL_PRODUCTS as BASE_PRODUCTS } from "../data/products.js";

const DETAILED_OVERRIDES = {
  1: { images: ["/images/Ashwagandha Powder.png"], qty: 60, unit: "grams", benefits: ["Reduces stress & anxiety by 44%", "Improves strength & endurance", "Supports healthy thyroid function", "Enhances cognitive function & memory", "Boosts testosterone & male vitality"], ingredients: ["KSM-66 Ashwagandha Root Extract 500mg", "Black Pepper Extract (Piperine) 5mg", "Organic Rice Flour (filler)", "Vegetable Capsule Shell"], usage: ["Take 1–2 capsules daily after meals", "Best taken with warm milk or water", "Use consistently for 8–12 weeks for optimal results", "Avoid if pregnant or breastfeeding"], aiReason: "Ashwagandha is a top adaptogen for stress, low energy, and hormonal balance. Based on your interest in wellness, this root extract directly targets cortisol regulation while supporting adrenal health — making it ideal for modern high-stress lifestyles.", aiTags: ["Stress Relief", "Energy Boost", "Hormonal Balance", "Adaptogen"] },
  2: { images: ["/images/Turmeric Gold Capsules.png"], qty: 60, unit: "capsules", benefits: ["Powerful anti-inflammatory action", "Supports joint health & mobility", "Rich in antioxidants", "Aids digestion & gut health", "Supports healthy liver function"], ingredients: ["Turmeric Root Extract (95% curcuminoids) 500mg", "BioPerine® Black Pepper 5mg", "Ginger Root Extract 50mg", "Vegetable Capsule"], usage: ["Take 2 capsules daily with meals", "Pair with a healthy fat for best absorption", "Consistent use for 4+ weeks recommended"], aiReason: "Curcumin in turmeric is one of the most researched anti-inflammatory compounds. It's ideal for joint pain, gut inflammation, and oxidative stress — combined with BioPerine® for superior bioavailability.", aiTags: ["Anti-Inflammatory", "Joint Health", "Antioxidant", "Gut Health"] },
  3: { images: ["/images/Moringa Leaf Extract.png"], qty: 100, unit: "grams", benefits: ["92+ essential nutrients in one dose", "Rich in iron — fights anaemia", "Powerful detoxification support", "Supports healthy blood sugar", "Complete plant-based protein source"], ingredients: ["Organic Moringa Oleifera Leaf Powder 100%", "No additives, fillers, or preservatives"], usage: ["Add 1 tsp to smoothies, juices or warm water", "Mix into yoghurt or oatmeal", "Start with half teaspoon and build up gradually"], aiReason: "Moringa is the most nutrient-dense plant on Earth. For anyone focused on nutrition, immunity, or iron intake — moringa delivers more vitamin C than oranges, more calcium than milk, and more protein than eggs per gram.", aiTags: ["Superfood", "Iron Rich", "Immunity", "Detox"] },
  4: { images: ["/images/Neem Face Wash.png"], qty: 100, unit: "ml", benefits: ["Fights acne & pimple-causing bacteria", "Unclogs pores and removes excess oil", "Anti-bacterial & anti-fungal properties", "Suitable for sensitive skin", "Reduces blackheads & whiteheads"], ingredients: ["Neem Leaf Extract", "Tea Tree Essential Oil", "Aloe Vera Gel", "Glycerin", "Vitamin E", "Aqua"], usage: ["Apply to wet face & neck", "Massage gently in circular motions for 60 seconds", "Rinse thoroughly with lukewarm water", "Use twice daily for best results"], aiReason: "Neem has been used in Ayurveda for over 4000 years as a natural antibiotic for skin. Combined with tea tree oil, this face wash targets acne at the root — without the harsh dryness of chemical alternatives.", aiTags: ["Anti-Acne", "Pore Care", "Natural Cleanser", "Sensitive Skin"] },
  5: { images: ["/images/Triphala Churna.png"], qty: 100, unit: "grams", benefits: ["Gently relieves constipation", "Supports healthy gut microbiome", "Natural full-body detox", "Rich in vitamin C (Amalaki)", "Supports eye health"], ingredients: ["Amalaki (Emblica officinalis) 33.3%", "Bibhitaki (Terminalia bellirica) 33.3%", "Haritaki (Terminalia chebula) 33.3%"], usage: ["Mix 1 tsp in warm water at bedtime", "Or take with honey in the morning", "Start with a smaller dose and increase gradually", "Not recommended during pregnancy"], aiReason: "Triphala is a cornerstone Ayurvedic formula with clinical evidence supporting its use for IBS, constipation, and gut microbiome health. It gently cleanses without dependency — unlike conventional laxatives.", aiTags: ["Digestive Health", "Detox", "Gut Microbiome", "Ayurvedic"] },
  6: { images: ["/images/Rose Hip Face Oil.png"], qty: 30, unit: "ml", benefits: ["Reduces scars & stretch marks", "Fades hyperpigmentation & dark spots", "Deep hydration without greasiness", "Anti-ageing vitamin A & C rich", "Improves skin texture & elasticity"], ingredients: ["Rosa Canina (Rosehip) Seed Oil 100%", "Cold-pressed, unrefined, hexane-free"], usage: ["Apply 3–4 drops to clean face & neck", "Gently massage until absorbed", "Use morning and evening", "Can be layered under moisturiser"], aiReason: "Rosehip oil's natural trans-retinoic acid (vitamin A) is clinically proven to reduce fine lines and scars. It's a rare plant oil that combines anti-ageing, brightening, and hydrating benefits — without synthetic retinoids.", aiTags: ["Anti-Ageing", "Brightening", "Scar Reduction", "Luxury Skincare"] },
  7: { images: ["/images/Tulsi Green Tea.png"], qty: 25, unit: "bags", benefits: ["Strengthens immune system", "Reduces stress & mental fatigue", "Rich in antioxidants & polyphenols", "Supports respiratory health", "Light caffeine — no jitters"], ingredients: ["Organic Tulsi (Holy Basil) Leaves", "Organic Green Tea Leaves", "Natural Lemon Essence"], usage: ["Steep 1 bag in 200ml hot water (85°C) for 2–3 mins", "Do not over-brew to avoid bitterness", "Enjoy 2–3 cups daily", "Add honey or lemon to taste"], aiReason: "Tulsi is revered as the 'Queen of Herbs' in Ayurveda for its adaptogenic and antimicrobial properties. Combined with green tea's EGCG antioxidants, this blend delivers calm energy and immune support in every cup.", aiTags: ["Immunity", "Stress Relief", "Antioxidant", "Caffeine-Light"] },
  8: { images: ["/images/Amla Hair Serum.png"], qty: 50, unit: "ml", benefits: ["Reduces hair fall by up to 47%", "Stimulates new hair follicle growth", "Strengthens hair from the root", "Adds natural shine & lustre", "Nourishes dry, damaged scalp"], ingredients: ["Amla (Phyllanthus emblica) Extract", "Bhringraj Extract", "Redensyl® 3%", "Biotin", "Argan Oil", "Keratin Proteins"], usage: ["Apply 4–6 drops to scalp on damp hair", "Massage gently for 2 minutes", "Leave in — do not rinse", "Use daily for best results"], aiReason: "Amla has the highest natural vitamin C content of any fruit and is scientifically validated for hair growth. Paired with Redensyl® — a clinically proven alternative to minoxidil — this serum addresses hair thinning at the follicular level.", aiTags: ["Hair Growth", "Hair Fall", "Scalp Health", "Strengthening"] },
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
    images: [p.image],
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
  Bestseller: "bg-gold/10 text-gold border border-gold/20",
  New:        "bg-forest/20 text-green-300 border border-forest/30",
  "Top Rated":"bg-gold/15 text-gold-light border border-gold/25",
  Premium:    "bg-purple-950/40 text-purple-300 border border-purple-800/30",
  Sale:       "bg-red-950/40 text-red-300 border border-red-800/30",
};

const REVIEWS = [
  { name: "Priya Sharma",    rating: 5, date: "March 2024",  text: "Absolutely love this product! I've been using it for 3 months and the difference is incredible. Genuine quality, fast delivery. Will definitely repurchase!", role: "Verified Buyer", helpful: 47 },
  { name: "Rajan Mehta",    rating: 5, date: "Feb 2024",    text: "The AI recommendation on the site suggested this for my stress issues and it's been a game-changer. Feel calmer and more focused every day.", role: "Verified Buyer", helpful: 33 },
  { name: "Kavya Nair",     rating: 4, date: "Jan 2024",    text: "Good quality product. Packaging is premium and delivery was quick. Noticed results after 4-5 weeks. Slightly expensive but worth it.", role: "Verified Buyer", helpful: 21 },
  { name: "Arjun Reddy",   rating: 5, date: "Dec 2023",    text: "Been taking this for 2 months. My energy levels are through the roof and I sleep so much better. 100% authentic product.", role: "Verified Buyer", helpful: 38 },
];

// ─── Image Gallery ─────────────────────────────────────────────────────────────
const ImageGallery = ({ images, productName }) => {
  const [zoomed, setZoomed] = useState(false);
  const src = images?.[0];

  return (
    <motion.div
      className="relative overflow-hidden rounded-sm bg-gradient-to-br from-surface to-surface-light border border-gold/15 aspect-square cursor-zoom-in group"
      onClick={() => setZoomed(!zoomed)}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <motion.img
        src={src}
        alt={productName}
        animate={{ scale: zoomed ? 1.18 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      {/* Zoom hint */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-surface-light/90 border border-gold/20 text-gold text-[10px] font-sans font-bold tracking-widest uppercase rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
        {zoomed ? "Zoom Out" : "Zoom In"}
      </div>
    </motion.div>
  );
};

// ─── AI Recommendation Box ─────────────────────────────────────────────────────
const AIRecommendationBox = ({ product }) => (
  <FadeUp delay={0.1}>
    <div className="relative overflow-hidden rounded-sm">
      {/* Animated border */}
      <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-sm bg-gradient-to-r from-gold/40 via-gold/10 to-gold/40 p-px">
        <div className="w-full h-full rounded-sm bg-bigbox" />
      </motion.div>

      <div className="relative bg-bigbox rounded-sm p-5 border border-gold/10">
        <div className="flex items-start gap-3 mb-3">
          <motion.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 4, repeat: Infinity }}
            className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-sm flex items-center justify-center text-lg flex-shrink-0">
            ✨
          </motion.div>
          <div>
            <div className="text-gold font-serif text-sm tracking-wide">Why This is Good for You</div>
            <div className="text-gold-dim/75 font-accent italic text-xs">AI-driven botanical diagnosis</div>
          </div>
        </div>

        <p className="text-[#F5F0E8]/90 text-sm leading-relaxed mb-4">{product.aiReason}</p>

        <div className="flex flex-wrap gap-2">
          {product.aiTags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-gold/5 border border-gold/20 text-gold-light text-[10px] font-sans font-bold tracking-widest uppercase rounded-sm">
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
    <FadeUp delay={0.05} className="bg-bigbox rounded-sm border border-gold/10 shadow-lg overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-gold/10 relative bg-surface-light">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-4 text-xs font-sans font-bold tracking-widest uppercase transition-all relative ${
              activeTab === i ? "text-gold" : "text-gold-dim hover:text-gold"
            }`}
          >
            <span className="mr-1.5">{tabIcons[i]}</span>
            {tab}
            {activeTab === i && (
              <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 bg-bigbox">
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
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-sm bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gold text-[9px] font-bold">✓</span>
                </span>
                <span className="text-[#F5F0E8]/90 text-sm leading-relaxed font-sans">{item}</span>
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
    <FadeUp className="bg-bigbox rounded-sm border border-gold/10 shadow-lg p-6">
      <h3 className="font-serif font-bold text-gold text-lg mb-6 tracking-wide">Customer Reviews</h3>

      {/* Rating summary */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8 pb-8 border-b border-gold/10">
        <div className="text-center flex-shrink-0">
          <div className="text-6xl font-serif font-bold text-[#F5F0E8]">{product.rating}</div>
          <div className="my-1.5 flex justify-center"><Stars rating={product.rating} size="md" /></div>
          <div className="text-[10px] text-gold-dim font-sans font-bold tracking-widest uppercase mt-1">{product.reviews} reviews</div>
        </div>
        <div className="flex-1 space-y-2">
          {ratingDist.map((stars, i) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-[10px] text-gold-dim w-8 font-sans font-bold tracking-wider">{stars}★</span>
              <div className="flex-1 h-1.5 bg-bg border border-gold/5 rounded-sm overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${distValues[i]}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gold rounded-sm"
                />
              </div>
              <span className="text-[10px] text-gold-dim w-8 font-sans font-bold text-right tracking-wider">{distValues[i]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {REVIEWS.map((review, i) => (
          <motion.div
            key={review.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 bg-surface-light border border-gold/10 rounded-sm shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-sm flex items-center justify-center text-sm font-serif font-bold text-gold">
                  {review.name[0]}
                </div>
                <div>
                  <div className="font-serif font-bold text-white text-sm">{review.name}</div>
                  <div className="text-[9px] text-gold font-sans font-bold tracking-widest uppercase">{review.role}</div>
                </div>
              </div>
              <span className="text-[10px] text-gold-dim font-sans tracking-wide">{review.date}</span>
            </div>
            <Stars rating={review.rating} />
            <p className="text-gold-dim text-sm leading-relaxed mt-3 font-sans">{review.text}</p>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gold/10">
              <span className="text-[10px] text-gold-dim/70 font-sans tracking-wider uppercase">Was this helpful?</span>
              <motion.button
                onClick={() => setHelpful((h) => ({ ...h, [i]: !h[i] }))}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-1.5 text-[10px] font-sans font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm transition-all border ${
                  helpful[i] ? "bg-gold/20 border-gold text-gold" : "bg-surface border-gold/10 text-gold-dim hover:text-gold"
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
const RelatedProducts = ({ currentId, products = [], onViewProduct }) => {
  const related = products.filter((p) => String(p._id || p.id) !== String(currentId));
  const scrollRef = useRef(null);

  return (
    <FadeUp className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] font-sans font-bold text-gold tracking-widest uppercase block mb-1">You May Also Like</span>
          <h3 className="text-2xl font-serif font-bold text-white">Related Formulations</h3>
        </div>
        <div className="flex gap-2">
          {[-1, 1].map((dir) => (
            <motion.button key={dir} onClick={() => scrollRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" })}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-9 h-9 bg-surface-light border border-gold/10 hover:border-gold/30 rounded-sm flex items-center justify-center text-gold transition-all">
              {dir === -1 ? "←" : "→"}
            </motion.button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {related.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -6, borderColor: "rgba(201, 168, 76, 0.4)" }}
            onClick={() => onViewProduct(product)}
            className="flex-shrink-0 w-52 bg-bigbox border border-gold/10 rounded-sm overflow-hidden cursor-pointer group flex flex-col justify-between"
          >
            <div className="overflow-hidden h-36 relative bg-bg border-b border-gold/10">
              <motion.img whileHover={{ scale: 1.08 }} transition={{ duration: 0.35 }}
                src={product.image} alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
              {product.tag && (
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-[8px] font-sans font-bold tracking-widest uppercase rounded-sm border ${tagColors[product.tag]}`}>{product.tag}</span>
              )}
            </div>
            <div className="p-3 flex flex-col flex-1 justify-between">
              <div>
                <p className="font-serif font-bold text-white text-xs leading-tight mb-1.5 line-clamp-2 group-hover:text-gold transition-colors">{product.name}</p>
                <div className="flex items-center gap-0.5 mb-2">
                  <Stars rating={product.rating} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gold/10">
                <span className="text-sm font-sans font-bold text-gold">₹{product.price}</span>
                <span className="text-[10px] font-sans text-gold-dim line-through">₹{product.mrp}</span>
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
  const { id }   = useParams();

  /* ── All state (must be before any early return) ── */
  const [rawProduct,   setRawProduct]   = useState(null);
  const [prodLoading,  setProdLoading]  = useState(true);
  const [relatedProds, setRelatedProds] = useState(RELATED_PLACEHOLDER);
  const [qty,          setQty]          = useState(1);
  const [cartAdded,    setCartAdded]    = useState(false);
  const [buyLoading,   setBuyLoading]   = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  /* ── Fetch single product by _id directly from backend ── */
  useEffect(() => {
    if (!id) return;
    setProdLoading(true);
    getProduct(id)
      .then(p  => setRawProduct(p))
      .catch(() => {
        const fallback = BASE_PRODUCTS.find(p => p.id === parseInt(id));
        setRawProduct(fallback || null);
      })
      .finally(() => setProdLoading(false));

    getProducts()
      .then(data => setRelatedProds(data.filter(p => String(p._id) !== String(id)).slice(0, 5).map(p => enrichProduct(p))))
      .catch(() => setRelatedProds(RELATED_PLACEHOLDER));
  }, [id]);

  const product = enrichProduct(rawProduct);
  const wished  = isInWishlist(product?._id || product?.id);

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

  /* ── Show loading / not found ── */
  if (prodLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold/25 border-t-gold rounded-sm animate-spin mx-auto mb-4" />
          <p className="text-gold-dim text-sm font-sans tracking-wide">Reading botanical formulation…</p>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-5xl opacity-40">🍃</span>
        <h2 className="text-xl font-serif font-bold text-gold">Formulation not found</h2>
        <p className="text-gold-dim/70 text-sm max-w-xs mb-2">The requested botanical remedy could not be resolved.</p>
        <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-gold hover:bg-gold-light text-bg font-sans font-bold text-xs tracking-widest uppercase rounded-sm transition-all duration-300 shimmer-btn-glow">Browse Apothecary</button>
      </div>
    );
  }

  const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg text-[#F5F0E8] font-sans antialiased">
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
                <span className="text-[10px] font-sans font-bold text-gold tracking-widest uppercase">{product.category}</span>
                {product.tag && (
                  <span className={`px-2.5 py-1 rounded-sm text-[8px] font-sans font-bold tracking-widest uppercase ${tagColors[product.tag] || ""}`}>{product.tag}</span>
                )}
                {product.inStock ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-gold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> In Stock
                  </span>
                ) : (
                  <span className="text-[10px] font-sans font-bold text-red-400 tracking-wider uppercase">⚠ Temporarily Depleted</span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight tracking-tight">{product.name}</h1>

              {/* Rating row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Stars rating={product.rating} />
                <span className="text-gold-dim text-sm font-sans font-semibold">({product.reviews} reviews)</span>
                <motion.button whileHover={{ x: 3 }} onClick={() => {}} className="text-xs text-gold font-sans font-bold tracking-wider uppercase hover:text-gold-light transition-colors">
                  Write feedback →
                </motion.button>
              </div>

              {/* Price block */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-sans font-bold text-gold">₹{product.price}</span>
                <span className="text-xl text-gold-dim line-through font-medium font-sans">₹{product.mrp}</span>
                <span className="px-2.5 py-0.5 bg-red-950/40 border border-red-800/30 text-red-300 text-[10px] font-sans font-bold tracking-widest uppercase rounded-sm">{discount}% OFF</span>
              </div>

              {/* Description */}
              <p className="text-gold-dim/90 text-sm leading-relaxed font-sans">{product.desc}</p>

              {/* Qty selector */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-sans font-bold text-gold-dim uppercase tracking-wider">Quantity:</span>
                <div className="flex items-center border border-gold/20 bg-surface-light rounded-sm overflow-hidden">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gold-dim hover:bg-surface hover:text-gold transition-colors font-bold text-sm">
                    −
                  </motion.button>
                  <span className="w-10 h-10 flex items-center justify-center font-sans font-bold text-white text-sm">{qty}</span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gold-dim hover:bg-surface hover:text-gold transition-colors font-bold text-sm">
                    +
                  </motion.button>
                </div>
                <span className="text-xs text-gold-dim/60 font-sans tracking-wide">{product.qty}{product.unit && ` ${product.unit}`} per bottle</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!product.inStock}
                  className={`flex-1 py-4 rounded-sm text-xs font-sans font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                    cartAdded
                      ? "bg-gold/20 border border-gold text-gold"
                      : product.inStock
                        ? "bg-gold text-bg shadow-md shadow-gold/5 shimmer-btn-glow"
                        : "bg-surface-light border border-gold/15 text-gold-dim cursor-not-allowed"
                  }`}
                >
                  {cartAdded ? (
                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <span>✓</span> Added to Bag
                    </motion.span>
                  ) : product.inStock ? "🛒 Add to Bag" : "Out of Stock"}
                </motion.button>

                <motion.button
                  onClick={handleBuyNow}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!product.inStock || buyLoading}
                  className="flex-1 py-4 rounded-sm text-xs font-sans font-bold tracking-widest uppercase bg-surface-light border border-gold/30 hover:border-gold text-gold transition-all duration-300 shimmer-btn-glow flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {buyLoading ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      className="block w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full" />
                  ) : "⚡ Order Now"}
                </motion.button>

                <motion.button onClick={() => toggleWishlist(product)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`w-14 h-14 rounded-sm border flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                    wished ? "border-red-400/30 bg-red-950/20 text-red-400" : "border-gold/10 bg-surface-light hover:border-red-400/30 text-gold-dim hover:text-red-400"
                  }`}>
                  {wished ? "♥" : "♡"}
                </motion.button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: "🚚", title: "Free Shipping", sub: "Orders above ₹299" },
                  { icon: "↩️", title: "Easy Returns",  sub: "7-day return policy" },
                  { icon: "🔒", title: "Secure Order", sub: "100% safe checkout" },
                ].map(({ icon, title, sub }) => (
                  <div key={title} className="flex flex-col items-center text-center p-3 bg-surface-light rounded-sm border border-gold/10">
                    <span className="text-lg mb-1">{icon}</span>
                    <span className="text-[10px] font-sans font-bold text-gold-dim uppercase tracking-wider">{title}</span>
                    <span className="text-[9px] text-gold-dim/50 font-sans tracking-wide mt-0.5">{sub}</span>
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
              <h2 className="text-xl font-serif font-bold text-gold mb-5 tracking-wide">Product Details</h2>
              <TabsSection product={product} />
            </FadeUp>

            {/* Certifications */}
            <FadeUp delay={0.1}>
              <h2 className="text-xl font-serif font-bold text-gold mb-5 tracking-wide">Certifications & Quality</h2>
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
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -3, borderColor: "rgba(201,168,76,0.3)" }}
                    className="bg-surface rounded-sm border border-gold/10 p-4 flex items-start gap-3 shadow-lg hover:border-gold/20 transition-all duration-300">
                    <span className="text-2xl flex-shrink-0">{icon}</span>
                    <div>
                      <div className="font-serif font-bold text-white text-xs">{title}</div>
                      <div className="text-gold-dim text-[10px] mt-0.5 font-sans leading-relaxed">{desc}</div>
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
          <RelatedProducts currentId={product._id || product.id} products={relatedProds} onViewProduct={onViewProduct} />
        </div>
      </div>
    </div>
  );
}
