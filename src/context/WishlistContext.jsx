import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

export const useWishlist = () => useContext(WishlistContext);

const STORAGE_KEY = 'nk_wishlist';

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  /* persist to localStorage */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(p => String(p.id) === String(product.id));
      return exists ? prev : [...prev, product];
    });
  };

  const removeFromWishlist = (id) =>
    setWishlist(prev => prev.filter(p => String(p.id) !== String(id)));

  const toggleWishlist = (product) => {
    const exists = wishlist.find(p => String(p.id) === String(product.id));
    exists ? removeFromWishlist(product.id) : addToWishlist(product);
  };

  const isInWishlist = (id) =>
    wishlist.some(p => String(p.id) === String(id));

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
