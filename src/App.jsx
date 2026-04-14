import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NatureKartHome    from "./pages/NatureKartHome.jsx";
import ProductListing    from "./pages/ProductListing.jsx";
import ProductDetails    from "./pages/ProductDetails.jsx";
import CartPage          from "./pages/CartPage.jsx";
import CheckoutPage      from "./pages/CheckoutPage.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import LoginPage         from "./pages/LoginPage.jsx";
import RegisterPage      from "./pages/RegisterPage.jsx";
import ProfilePage       from "./pages/ProfilePage.jsx";
import WishlistPage      from "./pages/WishlistPage.jsx";
import OrderTracking     from "./pages/OrderTracking.jsx";
import Loader            from "./components/Loader.jsx";
import CartPopup         from "./components/CartPopup.jsx";
import { useCart }       from "./context/CartContext.jsx";
import { useAuth }       from "./context/AuthContext.jsx";
import { ALL_PRODUCTS }  from "./data/products.js";

/* ── Protected Route wrapper ───────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/* ── App ───────────────────────────────────────────────────────────────────── */
function App() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { showCartPopup } = useCart();
  const [loading, setLoading]               = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* scroll to top on route change */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const navigatePage = (target) => {
    setLoading(true);
    setTimeout(() => { navigate(target); setLoading(false); }, 500);
  };

  const viewProduct = (product) => {
    setLoading(true);
    setTimeout(() => {
      setSelectedProduct(product);
      navigate(`/product/${product.id}`);
      setLoading(false);
    }, 500);
  };

  const getProductById = (id) =>
    ALL_PRODUCTS.find(p => p.id === parseInt(id));

  return (
    <>
      <Loader show={loading} />
      <CartPopup />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── Existing pages (UNCHANGED) ─────────────────────────────── */}
          <Route path="/" element={
            <NatureKartHome
              onNavigate={navigatePage}
              onViewProduct={viewProduct}
              showLoader={() => setLoading(true)}
            />
          } />

          <Route path="/shop" element={
            <ProductListing
              onNavigate={navigatePage}
              onViewProduct={viewProduct}
              showLoader={() => setLoading(true)}
            />
          } />

          <Route path="/product/:id" element={
            <ProductDetailsWrapper
              onNavigate={navigatePage}
              onViewProduct={viewProduct}
              getProductById={getProductById}
              showLoader={() => setLoading(true)}
            />
          } />

          <Route path="/cart"               element={<CartPage onNavigate={navigatePage} />} />
          <Route path="/checkout"           element={<CheckoutPageWrapper hideLoader={() => setLoading(false)} />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />

          {/* ── New auth pages ──────────────────────────────────────────── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── New feature pages ───────────────────────────────────────── */}
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile"  element={<ProfilePage />} />

          {/* Order tracking — with and without orderId */}
          <Route path="/order-tracking"          element={<OrderTracking />} />
          <Route path="/order-tracking/:orderId" element={<OrderTracking />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AnimatePresence>
    </>
  );
}

/* ── Wrappers (unchanged from original) ────────────────────────────────────── */
function ProductDetailsWrapper({ onNavigate, onViewProduct, getProductById, showLoader }) {
  const location = useLocation();
  const id       = location.pathname.split("/").pop();
  const product  = getProductById ? getProductById(id) : null;
  return (
    <ProductDetails
      product={product}
      onNavigate={onNavigate}
      onViewProduct={onViewProduct}
      showLoader={showLoader}
    />
  );
}

function CheckoutPageWrapper({ hideLoader }) {
  useEffect(() => { hideLoader(); }, [hideLoader]);
  return <CheckoutPage />;
}

export default App;