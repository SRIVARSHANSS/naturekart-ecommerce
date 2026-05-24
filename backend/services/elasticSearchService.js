const { Client } = require('@elastic/elasticsearch');
const Product = require('../models/Product');

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
let client = null;
let isESConnected = false;

try {
  client = new Client({ node: ELASTICSEARCH_URL });
} catch (e) {
  console.warn('⚠️ Could not initialize Elasticsearch client. Falling back to MongoDB.');
}

const checkESConnection = async () => {
  if (!client) {
    isESConnected = false;
    return false;
  }
  try {
    await client.ping();
    isESConnected = true;
    console.log('✅ Connected to Elasticsearch cluster');
    // Ensure index exists
    await setupIndex();
    return true;
  } catch (err) {
    isESConnected = false;
    console.warn('⚠️ Elasticsearch offline. Operating in high-performance MongoDB Fallback search mode.');
    return false;
  }
};

const setupIndex = async () => {
  if (!isESConnected) return;
  try {
    const exists = await client.indices.exists({ index: 'products' });
    if (!exists) {
      await client.indices.create({
        index: 'products',
        body: {
          settings: {
            analysis: {
              analyzer: {
                autocomplete: {
                  tokenizer: 'autocomplete',
                  filter: ['lowercase']
                },
                autocomplete_search: {
                  tokenizer: 'lowercase'
                }
              },
              tokenizer: {
                autocomplete: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 10,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: {
            properties: {
              productName: { type: 'text', analyzer: 'autocomplete', search_analyzer: 'autocomplete_search' },
              description: { type: 'text' },
              category: { type: 'keyword' },
              benefits: { type: 'text' },
              tags: { type: 'text' },
              brand: { type: 'keyword' },
              price: { type: 'float' },
              rating: { type: 'float' },
              reviews: { type: 'integer' },
              inStock: { type: 'boolean' }
            }
          }
        }
      });
      console.log('✅ Created products index in Elasticsearch');
      await syncAllProducts();
    }
  } catch (err) {
    console.error('ES Setup index error:', err.message);
  }
};

const indexProduct = async (product) => {
  if (!isESConnected || !client) return;
  try {
    await client.index({
      index: 'products',
      id: product._id.toString(),
      body: {
        productName: product.name,
        description: product.description || '',
        category: product.category,
        benefits: product.benefits || [],
        tags: product.tags || [],
        brand: 'NatureKart',
        price: product.price,
        image: product.image || '',
        icon: product.icon || '🌿',
        rating: product.rating || 4.5,
        reviews: product.reviews || 0,
        inStock: product.inStock
      }
    });
  } catch (err) {
    console.error('ES Index product error:', err.message);
  }
};

const deleteProductFromIndex = async (productId) => {
  if (!isESConnected || !client) return;
  try {
    await client.delete({
      index: 'products',
      id: productId.toString()
    });
  } catch (err) {
    console.error('ES Delete product error:', err.message);
  }
};

const syncAllProducts = async () => {
  if (!isESConnected || !client) return;
  try {
    const products = await Product.find();
    console.log(`🔄 Syncing ${products.length} products to Elasticsearch index...`);
    for (const p of products) {
      await indexProduct(p);
    }
    console.log('✅ Finished syncing all products to Elasticsearch.');
  } catch (err) {
    console.error('ES Sync products error:', err.message);
  }
};

/* ── AI Intent & Synonym Dictionary ────────────────────────────────────────── */
const SYNONYM_DICTIONARY = {
  'stress relief': ['ashwagandha', 'herbal tea', 'essential oils'],
  'anxiety': ['ashwagandha', 'herbal tea', 'essential oils'],
  'calm mind': ['ashwagandha', 'herbal tea', 'essential oils'],
  'energy booster': ['moringa', 'ashwagandha', 'supplements'],
  'immunity': ['ashwagandha', 'supplements', 'ayurveda'],
  'dry skin': ['skincare', 'essential oils'],
  'glow skin': ['skincare', 'essential oils', 'ayurveda'],
  'weight loss': ['herbal tea', 'organic foods'],
  'digestion': ['ayurveda', 'organic foods', 'herbal tea'],
  'sleep support': ['herbal tea', 'essential oils']
};

/* Levenshtein Typo Correction algorithm for fallback search */
const levenshteinDistance = (s1, s2) => {
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/* Get spelling suggestion from database products names */
const getTypoCorrection = async (query) => {
  const words = query.toLowerCase().split(/\s+/);
  const products = await Product.find({ inStock: true });
  const allDictionaryWords = new Set();
  
  products.forEach(p => {
    p.name.toLowerCase().split(/[\s,.-]+/).forEach(w => {
      if (w.length > 3) allDictionaryWords.add(w);
    });
    p.tags.forEach(t => allDictionaryWords.add(t.toLowerCase()));
  });

  const correctedWords = words.map(word => {
    if (word.length <= 3) return word;
    let closestWord = word;
    let minDistance = 3; // Max threshold

    for (const dictWord of allDictionaryWords) {
      const dist = levenshteinDistance(word, dictWord);
      if (dist < minDistance) {
        minDistance = dist;
        closestWord = dictWord;
      }
    }
    return closestWord;
  });

  const correctedQuery = correctedWords.join(' ');
  return correctedQuery !== query.toLowerCase() ? correctedQuery : null;
};

/* ── SEARCH ENGINE LOGIC (DUAL CORE) ────────────────────────────────────────── */
const searchProducts = async (queryStr) => {
  const query = queryStr?.trim() || '';
  if (!query) return { products: [], correctedQuery: null };

  // Expand AI intent search
  let expandedTerms = [query];
  const lowerQuery = query.toLowerCase();
  Object.keys(SYNONYM_DICTIONARY).forEach(key => {
    if (lowerQuery.includes(key) || key.includes(lowerQuery)) {
      expandedTerms = [...expandedTerms, ...SYNONYM_DICTIONARY[key]];
    }
  });

  // Get Typo Suggestion
  const correctedQuery = await getTypoCorrection(query);

  if (isESConnected && client) {
    try {
      console.log(`🔎 Querying Elasticsearch for: "${query}"`);
      const response = await client.search({
        index: 'products',
        body: {
          query: {
            bool: {
              should: [
                {
                  match: {
                    productName: {
                      query,
                      fuzziness: 'AUTO',
                      boost: 4
                    }
                  }
                },
                {
                  match: {
                    tags: {
                      query: expandedTerms.join(' '),
                      fuzziness: 'AUTO',
                      boost: 2
                    }
                  }
                },
                {
                  match: {
                    description: {
                      query,
                      fuzziness: 'AUTO'
                    }
                  }
                }
              ]
            }
          }
        }
      });

      const esHits = response.hits.hits;
      const products = esHits.map(hit => ({
        _id: hit._id,
        id: hit._id,
        name: hit._source.productName,
        price: hit._source.price,
        category: hit._source.category,
        description: hit._source.description,
        benefits: hit._source.benefits,
        tags: hit._source.tags,
        image: hit._source.image,
        icon: hit._source.icon,
        rating: hit._source.rating,
        reviews: hit._source.reviews,
        inStock: hit._source.inStock
      }));

      return { products, correctedQuery };
    } catch (err) {
      console.error('ES Search failed, falling back to MongoDB:', err.message);
    }
  }

  // MONGODB FUZZY FALLBACK SEARCH
  console.log(`🍃 Querying Intelligent MongoDB Fallback Search for: "${query}"`);
  
  // Prepare match fields
  const regexConditions = expandedTerms.map(term => ({
    $or: [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { category: { $regex: term, $options: 'i' } },
      { tags: { $regex: term, $options: 'i' } },
      { benefits: { $regex: term, $options: 'i' } }
    ]
  }));

  let products = await Product.find({
    $or: regexConditions.flatMap(c => c.$or)
  });

  // If no products found, try using the corrected spelling query
  if (products.length === 0 && correctedQuery) {
    console.log(`💡 No match. Retrying MongoDB with typo correction: "${correctedQuery}"`);
    const correctedConditions = {
      $or: [
        { name: { $regex: correctedQuery, $options: 'i' } },
        { tags: { $regex: correctedQuery, $options: 'i' } }
      ]
    };
    products = await Product.find(correctedConditions);
  }

  return { products, correctedQuery };
};

/* ── AUTO-SUGGESTIONS LOGIC ─────────────────────────────────────────────────── */
const getAutoSuggestions = async (queryStr) => {
  const query = queryStr?.trim() || '';
  if (!query) return [];

  if (isESConnected && client) {
    try {
      const response = await client.search({
        index: 'products',
        body: {
          _source: ['productName'],
          query: {
            match_phrase_prefix: {
              productName: query
            }
          },
          size: 5
        }
      });
      return response.hits.hits.map(h => h._source.productName);
    } catch (err) {
      console.error('ES suggestions failed, falling back to MongoDB:', err.message);
    }
  }

  // MongoDB Autocomplete Fallback
  const products = await Product.find({
    name: { $regex: `^${query}`, $options: 'i' }
  }).limit(5);

  if (products.length > 0) {
    return products.map(p => p.name);
  }

  // Try substring prefix if no exact start match
  const subProducts = await Product.find({
    name: { $regex: query, $options: 'i' }
  }).limit(5);

  return subProducts.map(p => p.name);
};

// Start ES validation asynchronously
setTimeout(() => {
  checkESConnection();
}, 2000);

module.exports = {
  checkESConnection,
  indexProduct,
  deleteProductFromIndex,
  searchProducts,
  getAutoSuggestions,
  syncAllProducts
};
