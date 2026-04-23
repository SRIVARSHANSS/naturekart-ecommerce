/**
 * NatureKart — AI Routes (NatureBot)
 * POST /api/ai/chat       → full chat with product recommendations
 * POST /api/ai/quick-chat → lightweight version for floating widget
 */
const express = require('express');
const OpenAI  = require('openai');
const Product = require('../models/Product');

const router = express.Router();

const openai = new OpenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

/* ── Category → keyword mapping for MongoDB product search ─────────────────── */
const CATEGORY_KEYWORDS = {
  stress:    ['ashwagandha', 'brahmi', 'stress', 'adaptogen', 'anxiety', 'calm', 'tulsi', 'cortisol'],
  sleep:     ['chamomile', 'sleep', 'lavender', 'kesar', 'saffron', 'relax', 'melatonin', 'rest', 'insomnia'],
  immunity:  ['amla', 'giloy', 'tulsi', 'immunity', 'vitamin c', 'black seed', 'immune', 'chyawanprash'],
  weight:    ['green coffee', 'garcinia', 'moringa', 'weight', 'metabolism', 'fat', 'slim', 'detox'],
  skincare:  ['neem', 'turmeric', 'rose', 'skin', 'face', 'glow', 'brightening', 'acne', 'complexion'],
  energy:    ['shilajit', 'ginseng', 'moringa', 'energy', 'stamina', 'vitality', 'fatigue', 'tiredness', 'beetroot'],
  digestion: ['triphala', 'ginger', 'peppermint', 'digest', 'gut', 'hing', 'constipation', 'bloating', 'enzyme', 'aloe'],
  general:   ['multivitamin', 'moringa', 'tulsi', 'wellness', 'health', 'ashwagandha'],
};

const FOLLOW_UPS = {
  stress:    ['Tell me more about your stress symptoms', 'Do you prefer capsules or powder form?'],
  sleep:     ['How many hours are you currently sleeping?', 'Do you prefer tea or capsule form?'],
  immunity:  ['Are you looking for daily immunity or post-illness recovery?', 'Any herbal allergies?'],
  weight:    ['Are you looking for appetite control or metabolism boost?', 'Do you exercise regularly?'],
  skincare:  ['Is this for face, body, or hair care?', 'Do you have oily, dry, or combination skin?'],
  energy:    ['Is your fatigue more physical or mental?', 'Do you prefer morning or evening supplements?'],
  digestion: ['Do you experience bloating, constipation, or acidity?', 'How often do digestive issues occur?'],
  general:   ['What specific health goal are you working towards?', 'Are you looking for daily wellness support?'],
};

const SYSTEM_PROMPT = `You are NatureBot — the intelligent health assistant for NatureKart, India's premium organic e-commerce platform. Your personality: Warm, empathetic, knowledgeable about Ayurveda and natural wellness, slightly conversational. You speak like a trusted health friend, not a robot.

Your job:
- Understand user health concerns from natural language
- Respond with empathy first, then practical natural remedy advice
- Always suggest NatureKart products as solutions
- Ask ONE smart follow-up question if needed (e.g., "Do you prefer capsules or powder?")
- Keep responses concise but helpful (2–4 sentences max per reply)
- Always end with a gentle nudge toward the recommended products

After your response text, on a NEW LINE output ONLY this exact JSON (no markdown, no code block, no explanation):
INTENT_JSON:{"category":"<stress|sleep|immunity|weight|skincare|energy|digestion|general>","keywords":["keyword1","keyword2"],"confidence":0.95}

Rules:
- Never make medical diagnoses
- Never recommend prescription medication
- Always clarify you're suggesting natural/Ayurvedic supplements
- Be culturally aware — many users are from India`;

/* ── Helper: search products from MongoDB ───────────────────────────────────── */
async function findProducts(category, extraKeywords = [], limit = 4) {
  const baseKeywords = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.general;
  const allKeywords  = [...new Set([...baseKeywords, ...extraKeywords])].slice(0, 12);

  const regexArray = allKeywords.map(kw => new RegExp(kw, 'i'));

  const products = await Product.find({
    $or: [
      { name:        { $in: regexArray } },
      { description: { $in: regexArray } },
      { aiReason:    { $in: regexArray } },
      { tag:         { $in: regexArray } },
    ],
    inStock: true,
  }).limit(limit);

  /* Fallback: return any products if none matched */
  if (products.length === 0) {
    return Product.find({ inStock: true }).limit(limit);
  }
  return products;
}

/* ── Helper: parse AI response ──────────────────────────────────────────────── */
function parseAIResponse(fullText) {
  let category   = 'general';
  let keywords   = [];
  let confidence = 0;
  let message    = fullText;

  const match = fullText.match(/INTENT_JSON:\s*(\{[^}]+\})/);
  if (match) {
    try {
      const intent = JSON.parse(match[1]);
      category   = intent.category   || 'general';
      keywords   = intent.keywords   || [];
      confidence = intent.confidence || 0;
      message    = fullText.substring(0, fullText.indexOf('INTENT_JSON:')).trim();
    } catch (_) {
      message = fullText.replace(/INTENT_JSON:.*$/s, '').trim();
    }
  }
  return { message, category, keywords, confidence };
}

/* ══ POST /api/ai/chat ═══════════════════════════════════════════════════════ */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const completion = await openai.chat.completions.create({
      model:       'gemini-1.5-flash',
      messages,
      max_tokens:  400,
      temperature: 0.7,
    });

    const fullText = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
    const { message: aiMessage, category, keywords, confidence } = parseAIResponse(fullText);

    const products = await findProducts(category, keywords);

    res.json({
      message:           aiMessage,
      products,
      category,
      confidence,
      followUpSuggestions: (FOLLOW_UPS[category] || FOLLOW_UPS.general).slice(0, 2),
    });
  } catch (err) {
    console.error('AI /chat error:', err.message);
    res.status(500).json({
      message: 'NatureBot is resting. Please try again in a moment.',
      products: [],
      category: 'general',
      followUpSuggestions: [],
    });
  }
});

/* ══ POST /api/ai/quick-chat ═════════════════════════════════════════════════ */
router.post('/quick-chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const completion = await openai.chat.completions.create({
      model:       'gemini-1.5-flash',
      messages,
      max_tokens:  150,
      temperature: 0.7,
    });

    const fullText = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
    const { message: aiMessage, category } = parseAIResponse(fullText);

    res.json({ message: aiMessage, category });
  } catch (err) {
    console.error('AI /quick-chat error:', err.message);
    res.status(500).json({ message: 'NatureBot is resting. Please try again.' });
  }
});

module.exports = router;
