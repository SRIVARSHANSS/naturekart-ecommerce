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
import { ALL_PRODUCTS } from "./data/products.js";

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
  return ALL_PRODUCTS;
}

export default App;