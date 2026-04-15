/**
 * useProducts — fetches products from MongoDB Atlas via the backend API.
 * Drop-in replacement for the old static ALL_PRODUCTS import.
 */
import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/api.js';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      /* Normalise: backend uses _id, frontend uses id */
      setProducts(data.map(p => ({ ...p, id: p._id })));
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { products, loading, error, refresh: fetch };
}

/* Convenience — single product by _id or numeric id */
export function useProduct(id) {
  const { products, loading, error } = useProducts();
  const product = products.find(p => p._id === id || String(p.id) === String(id));
  return { product, loading, error };
}
