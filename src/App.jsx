import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NatureKartHome from "./pages/NatureKartHome.jsx";
import ProductListing from "./pages/ProductListing.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import Loader from "./components/Loader.jsx";
import CartPopup from "./components/CartPopup.jsx";
import { useCart } from "./context/CartContext.jsx";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showCartPopup } = useCart();
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href && link.href.includes('/')) {
        const path = new URL(link.href).pathname;
        if (path !== location.pathname) {
          setLoading(true);
          setTimeout(() => setLoading(false), 600);
        }
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [location.pathname]);

  const navigatePage = (target) => {
    setLoading(true);
    setTimeout(() => {
      navigate(target);
      setLoading(false);
    }, 600);
  };

  const viewProduct = (product) => {
    setLoading(true);
    setTimeout(() => {
      setSelectedProduct(product);
      navigate(`/product/${product.id}`);
      setLoading(false);
    }, 600);
  };

  const goToProduct = (id) => {
    const product = getProductById(id);
    if (product) {
      viewProduct(product);
    }
  };

  const getProductById = (id) => {
    const allProducts = getAllProducts();
    return allProducts.find(p => p.id === parseInt(id));
  };

  const showLoader = () => {
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  return (
    <>
      <Loader show={loading} />
      <CartPopup />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <NatureKartHome 
              onNavigate={navigatePage} 
              onViewProduct={viewProduct}
              showLoader={showLoader}
            />
          } />
          <Route path="/shop" element={
            <ProductListing 
              onNavigate={navigatePage} 
              onViewProduct={viewProduct}
              showLoader={showLoader}
            />
          } />
          <Route path="/product/:id" element={
            <ProductDetailsWrapper 
              onNavigate={navigatePage} 
              onViewProduct={viewProduct}
              getProductById={getProductById}
              showLoader={showLoader}
            />
          } />
          <Route path="/cart" element={<CartPage onNavigate={navigatePage} />} />
          <Route path="/checkout" element={<CheckoutPageWrapper hideLoader={hideLoader} />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function ProductDetailsWrapper({ onNavigate, onViewProduct, getProductById, showLoader }) {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  const product = getProductById ? getProductById(id) : null;
  return <ProductDetails product={product} onNavigate={onNavigate} onViewProduct={onViewProduct} showLoader={showLoader} />;
}

function CheckoutPageWrapper({ hideLoader }) {
  useEffect(() => {
    hideLoader();
  }, [hideLoader]);
  return <CheckoutPage />;
}

function getAllProducts() {
  return [
    { id: 1, name: "Ashwagandha Powder", price: 349, rating: 4.8, reviews: 240, tag: "Bestseller", category: "Ayurveda", icon: "🌿", image: "/images/ashwagandha.png", inStock: true, desc: "Pure KSM-66 Ashwagandha root extract for stress relief & energy." },
    { id: 2, name: "Turmeric Gold Capsules", price: 299, rating: 4.7, reviews: 180, tag: "New", category: "Supplements", icon: "🟡", image: "/images/turmeric.png", inStock: true, desc: "High-curcumin turmeric with black pepper for maximum absorption." },
    { id: 3, name: "Moringa Leaf Extract", price: 449, rating: 4.9, reviews: 310, tag: "Top Rated", category: "Supplements", icon: "🌱", image: "/images/moringa.png", inStock: true, desc: "Superfood-grade moringa leaf powder packed with 92+ nutrients." },
    { id: 4, name: "Neem Face Wash", price: 199, rating: 4.5, reviews: 120, tag: null, category: "Skincare", icon: "💚", image: "/images/neem-facewash.png", inStock: true, desc: "Anti-bacterial neem & tea tree face wash for clear, acne-free skin." },
    { id: 5, name: "Triphala Churna", price: 249, rating: 4.6, reviews: 95, tag: null, category: "Ayurveda", icon: "🪴", image: "/images/triphala.png", inStock: true, desc: "Ancient Ayurvedic blend of three fruits for digestive wellness." },
    { id: 6, name: "Rose Hip Face Oil", price: 599, rating: 4.8, reviews: 205, tag: "Premium", category: "Skincare", icon: "🌸", image: "/images/rosehip.png", inStock: true, desc: "Cold-pressed rosehip oil rich in vitamin C for anti-ageing glow." },
    { id: 7, name: "Tulsi Green Tea", price: 179, rating: 4.7, reviews: 160, tag: null, category: "Herbal Tea", icon: "🍵", image: "/images/tulsi-tea.png", inStock: true, desc: "Immunity-boosting tulsi & green tea blend, naturally caffeine light." },
    { id: 8, name: "Amla Hair Serum", price: 329, rating: 4.6, reviews: 140, tag: "Sale", category: "Hair Care", icon: "💧", image: "/images/amla-serum.png", inStock: false, desc: "Amla & Bhringraj enriched serum for hair growth and scalp health." },
    { id: 9, name: "Brahmi Memory Capsules", price: 389, rating: 4.7, reviews: 88, tag: "New", category: "Supplements", icon: "🧠", image: "/images/ashwagandha.png", inStock: true, desc: "Bacopa monnieri extract to enhance memory and cognitive clarity." },
    { id: 10, name: "Shilajit Resin", price: 799, rating: 4.9, reviews: 432, tag: "Bestseller", category: "Ayurveda", icon: "⚫", image: "/images/triphala.png", inStock: true, desc: "Himalayan shilajit with 85+ minerals for peak vitality." },
    { id: 11, name: "Aloe Vera Gel", price: 149, rating: 4.5, reviews: 310, tag: null, category: "Skincare", icon: "🌵", image: "/images/moringa.png", inStock: true, desc: "Pure 99% aloe vera gel — hydrating, cooling, and soothing." },
    { id: 12, name: "Chamomile Sleep Tea", price: 219, rating: 4.6, reviews: 74, tag: null, category: "Herbal Tea", icon: "🌼", image: "/images/tulsi-tea.png", inStock: true, desc: "Calming chamomile blend for restful sleep and relaxation." },
    { id: 13, name: "Argan Hair Oil", price: 499, rating: 4.8, reviews: 192, tag: "Premium", category: "Hair Care", icon: "✨", image: "/images/rosehip.png", inStock: false, desc: "100% pure Moroccan argan oil for silky, frizz-free hair." },
    { id: 14, name: "Digestive Enzymes Mix", price: 279, rating: 4.4, reviews: 56, tag: null, category: "Supplements", icon: "🫀", image: "/images/turmeric.png", inStock: true, desc: "Plant-based enzyme blend for optimal gut health and digestion." },
    { id: 15, name: "Ginger Lemon Detox Tea", price: 199, rating: 4.7, reviews: 134, tag: "Sale", category: "Herbal Tea", icon: "🍋", image: "/images/tulsi-tea.png", inStock: true, desc: "Zesty ginger & lemon detox tea to cleanse and refresh." },
    { id: 16, name: "Vitamin C Face Serum", price: 449, rating: 4.8, reviews: 267, tag: "Bestseller", category: "Skincare", icon: "🍊", image: "/images/neem-facewash.png", inStock: true, desc: "Brightening vitamin C serum with hyaluronic acid for radiant skin." },
  ];
}

export default App;