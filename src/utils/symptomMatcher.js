/**
 * NatureKart — Symptom Matcher Engine
 * Pure keyword-matching scoring system for Ayurvedic products.
 */
import { PRODUCT_KNOWLEDGE } from '../data/productKnowledge';

const CATEGORY_KEYWORDS = {
  stress: ["stress", "anxiety", "insomnia", "tension", "fatigue", "worry", "cortisol", "calm", "relax", "headache", "brain fog", "weakness", "focus", "memory", "restless"],
  sleep: ["sleep", "insomnia", "sleeplessness", "night waking", "restless", "chamomile", "lavender", "bedtime", "night"],
  immunity: ["immunity", "cold", "cough", "flu", "fever", "infection", "sore throat", "throat", "congestion", "virus", "runny nose", "defense", "respiratory"],
  weight: ["weight loss", "fat burn", "metabolism", "weight", "slim", "appetite", "obesity", "diet", "fitness", "belly fat"],
  skincare: ["skin glow", "acne", "pimples", "dry skin", "oily skin", "glow", "wrinkles", "dark spots", "toner", "face wash", "hair fall", "hair growth", "dandruff", "baldness", "hair loss", "hair care", "shampoo", "scalp"],
  energy: ["energy", "stamina", "vitality", "weakness", "exhaustion", "tiredness", "fatigue", "vigor", "strength", "physical"],
  digestion: ["stomach pain", "acidity", "bloating", "constipation", "gas", "indigestion", "heartburn", "acid reflux", "gut", "digest", "stomach ache", "cramp"],
  general: ["wellness", "health", "daily", "multivitamin", "nutrition", "supplement", "joints", "joint pain", "arthritis", "inflammation"]
};

const EMPATHETIC_RESPONSES = {
  stress: "I understand how exhausting mental tension can be. To help calm your nervous system, lower cortisol levels, and ease headache or anxiety symptoms, ancient adaptogenic herbs like Ashwagandha and Brahmi are excellent. Here is what I recommend for your peace of mind:",
  sleep: "Restful sleep is key to rejuvenating your body. If you're struggling with sleeplessness or insomnia, gentle sedatives like Chamomile tea or Lavender essential oil can help quiet the mind for deep sleep. Here are the best natural sleep aids for you:",
  immunity: "Caring for your body's defenses is vital, especially during cold and flu season. For soothing a sore throat, clearing chest congestion, or boosting general immunity, Vitamin C-rich Amla and respiratory-clearing Tulsi work wonders. Here are the top immune supports:",
  weight: "Embarking on a weight management journey is a great step for your health. To safely support fat burning, curb excessive cravings, and naturally boost metabolism, green coffee bean extracts and Garcinia are highly effective. Here are your matches:",
  skincare: "Your hair and skin reflect your internal health. For concerns like acne, dry skin, hair fall, or scalp dandruff, purifying herbs like Neem and nourishing agents like Bhringraj or Saffron oil provide natural care. Here are the beauty and skincare solutions for you:",
  energy: "Dealing with constant fatigue or physical weakness can hold you back. Pure Himalayan Shilajit, Ginseng, and Beetroot powder are excellent for accelerating stamina, blood circulation, and physical recovery. Check out these vitality boosters:",
  digestion: "Gut issues like acidity, gas, or constipation can disrupt your entire day. Gentle bowel cleansers like Triphala and digestive aids like ginger or peppermint are highly recommended to balance your stomach acid. Here are your stomach remedies:",
  general: "Focusing on overall wellness and joint comfort is wonderful. Daily multivitamin complexes, anti-inflammatory turmeric, and superfoods like moringa keep your joints supple and body nourished. Here are some excellent daily health supports:"
};

const FOLLOW_UPS = {
  stress: ["Do you prefer capsules or root powder?", "Are you experiencing physical fatigue too?"],
  sleep: ["Do you prefer a warm herbal tea or capsules?", "Is stress keeping you awake at night?"],
  immunity: ["Is this for a daily health boost or active cold/cough?", "Would you prefer a liquid extract or tablets?"],
  weight: ["Are you looking for appetite control or metabolism boost?", "Are you doing regular physical workouts?"],
  skincare: ["Is this for acne relief or dry skin glow?", "Do you prefer a face wash or topical face oil?"],
  energy: ["Do you feel more mentally tired or physically weak?", "Are you looking for a pre-workout booster?"],
  digestion: ["Do you experience bloating, gas, or acidity?", "Do you prefer powder mix or easy capsules?"],
  general: ["What specific health goal are you working towards?", "Are you looking for daily wellness support?"],
};

/**
 * Clean and normalize query text
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score a product based on matching query tokens
 */
function calculateProductScore(product, queryNorm, queryTokens) {
  let score = 0;
  const prodNameLower = product.name.toLowerCase();
  
  // 1. Phrase matching for multi-word keywords
  product.keywords.forEach(keyword => {
    const kwLower = keyword.toLowerCase();
    if (kwLower.includes(" ")) {
      if (queryNorm.includes(kwLower)) {
        score += 12; // High weight for multi-word match (e.g. "hair fall", "weight loss")
      }
    }
  });

  // 2. Token-by-token matching
  queryTokens.forEach(token => {
    if (token.length < 3) return; // Ignore very small words

    // Check if token matches product name
    if (prodNameLower.includes(token)) {
      score += 8;
    }

    // Check if token matches product keywords
    product.keywords.forEach(keyword => {
      const kwLower = keyword.toLowerCase();
      if (kwLower === token) {
        score += 5; // Exact keyword match
      } else if (kwLower.includes(token) || token.includes(kwLower)) {
        score += 2; // Partial keyword match
      }
    });
  });

  return score;
}

/**
 * Match symptoms and return recommendations
 * @param {string} query - User input
 * @param {Array} dbProducts - List of products loaded from the database (with MongoDB _id)
 */
export function matchSymptoms(query, dbProducts = []) {
  if (!query || !query.trim()) {
    return {
      message: "Please tell me what health concerns you have today.",
      products: [],
      category: "general",
      confidence: 0,
      followUpSuggestions: FOLLOW_UPS.general
    };
  }

  const queryNorm = normalizeText(query);
  const queryTokens = queryNorm.split(" ");

  // 1. Classify Category
  let categoryScores = {
    stress: 0,
    sleep: 0,
    immunity: 0,
    weight: 0,
    skincare: 0,
    energy: 0,
    digestion: 0,
    general: 0
  };

  // Score categories based on occurrences in the query
  Object.keys(CATEGORY_KEYWORDS).forEach(cat => {
    CATEGORY_KEYWORDS[cat].forEach(kw => {
      if (queryNorm.includes(kw.toLowerCase())) {
        // Multi-word category keywords get more weight
        categoryScores[cat] += kw.includes(" ") ? 8 : 4;
      }
    });
  });

  // Find category with highest score
  let detectedCategory = "general";
  let maxCatScore = 0;
  Object.keys(categoryScores).forEach(cat => {
    if (categoryScores[cat] > maxCatScore) {
      maxCatScore = categoryScores[cat];
      detectedCategory = cat;
    }
  });

  // 2. Score and Rank Products
  const scoredKnowledge = PRODUCT_KNOWLEDGE.map(pk => {
    const score = calculateProductScore(pk, queryNorm, queryTokens);
    return { ...pk, score };
  });

  // Boost products belonging to the detected category
  scoredKnowledge.forEach(pk => {
    if (pk.category === detectedCategory && pk.score > 0) {
      pk.score += 6; // Category match boost
    }
  });

  // Sort by score descending
  const sortedKnowledge = scoredKnowledge
    .filter(pk => pk.score > 0)
    .sort((a, b) => b.score - a.score);

  // Match the knowledge items to actual DB products to obtain _ids, prices, and images
  let matchedProducts = [];

  sortedKnowledge.forEach(pkItem => {
    // Try to find the matching product in the database products
    let dbMatch = dbProducts.find(p => p.name.toLowerCase() === pkItem.name.toLowerCase());
    
    if (dbMatch) {
      matchedProducts.push({
        _id: dbMatch._id,
        name: dbMatch.name,
        price: dbMatch.price,
        image: dbMatch.image,
        icon: dbMatch.icon || pkItem.icon || "🌿",
        rating: dbMatch.rating || 4.5,
        reviews: dbMatch.reviews || 80,
        category: pkItem.category,
        aiReason: pkItem.aiReason
      });
    }
  });

  // Fallback: If no products matched, show top items from the detected category
  if (matchedProducts.length === 0) {
    const categoryPkItems = PRODUCT_KNOWLEDGE.filter(pk => pk.category === detectedCategory).slice(0, 3);
    categoryPkItems.forEach(pkItem => {
      let dbMatch = dbProducts.find(p => p.name.toLowerCase() === pkItem.name.toLowerCase());
      if (dbMatch) {
        matchedProducts.push({
          _id: dbMatch._id,
          name: dbMatch.name,
          price: dbMatch.price,
          image: dbMatch.image,
          icon: dbMatch.icon || "🌿",
          rating: dbMatch.rating || 4.5,
          reviews: dbMatch.reviews || 80,
          category: pkItem.category,
          aiReason: pkItem.aiReason
        });
      }
    });
  }

  // Final fallback (if DB products are not loaded or empty)
  if (matchedProducts.length === 0) {
    // Just return the top 3 from the static list (with static numbers as _ids for safety)
    const categoryPkItems = PRODUCT_KNOWLEDGE.filter(pk => pk.category === detectedCategory).slice(0, 3);
    matchedProducts = categoryPkItems.map((pkItem, idx) => ({
      _id: `static-${idx}`,
      name: pkItem.name,
      price: 299,
      image: `/images/${pkItem.name}.png`,
      icon: "🌿",
      rating: 4.6,
      reviews: 120,
      category: pkItem.category,
      aiReason: pkItem.aiReason
    }));
  }

  // Cap recommendations at 4 products
  const finalProducts = matchedProducts.slice(0, 4);

  // 3. Build response payload
  const aiMessage = EMPATHETIC_RESPONSES[detectedCategory] || EMPATHETIC_RESPONSES.general;
  const followUps = FOLLOW_UPS[detectedCategory] || FOLLOW_UPS.general;

  return {
    message: aiMessage,
    products: finalProducts,
    category: detectedCategory,
    confidence: maxCatScore > 0 ? Math.min(1.0, maxCatScore / 15) : 0.5,
    followUpSuggestions: followUps
  };
}
