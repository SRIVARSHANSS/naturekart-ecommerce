import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* Customer pages */
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
import AboutPage         from "./pages/AboutPage.jsx";
import ContactPage       from "./pages/ContactPage.jsx";

/* Admin pages */
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProducts  from "./pages/admin/AdminProducts.jsx";
import AdminOrders    from "./pages/admin/AdminOrders.jsx";

/* Components */
import Loader    from "./components/Loader.jsx";
import CartPopup from "./components/CartPopup.jsx";

/* Contexts */
import { useCart }    from "./context/CartContext.jsx";
import { useAuth }    from "./context/AuthContext.jsx";
/* Note: products are now fetched from MongoDB Atlas via /api/products */

/* ── Admin Route Guard ─────────────────────────────────────────────────────── */
function AdminRoute({ children }) {
  const { isAdmin, isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/" replace />;
  return children;
}

/* ── App ───────────────────────────────────────────────────────────────────── */
function App() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [loading, setLoading]   = useState(false);

  /* Scroll to top on route change */
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
      /* Use MongoDB _id; fallback to numeric id for static products */
      const pid = product._id || product.id;
      navigate(`/product/${pid}`);
      setLoading(false);
    }, 500);
  };

  /* Products are fetched per-page from the API — no static lookup needed */

  return (
    <>
      <Loader show={loading} />
      <CartPopup />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── Customer routes (untouched) ────────────────────────────── */}
          <Route path="/" element={
            <NatureKartHome onNavigate={navigatePage} onViewProduct={viewProduct} showLoader={() => setLoading(true)} />
          } />
          <Route path="/shop" element={
            <ProductListing onNavigate={navigatePage} onViewProduct={viewProduct} showLoader={() => setLoading(true)} />
          } />
          <Route path="/product/:id" element={
            <ProductDetailsWrapper onNavigate={navigatePage} onViewProduct={viewProduct} showLoader={() => setLoading(true)} />
          } />
          <Route path="/cart"               element={<CartPage onNavigate={navigatePage} />} />
          <Route path="/checkout"           element={<CheckoutPageWrapper hideLoader={() => setLoading(false)} />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login"              element={<LoginPage />} />
          <Route path="/register"           element={<RegisterPage />} />
          <Route path="/wishlist"           element={<WishlistPage />} />
          <Route path="/profile"            element={<ProfilePage />} />
          <Route path="/order-tracking"          element={<OrderTracking />} />
          <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
          <Route path="/about"                   element={<AboutPage />} />
          <Route path="/contact"                 element={<ContactPage />} />

          {/* ── Admin routes (protected) ───────────────────────────────── */}
          <Route path="/admin"           element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products"  element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders"    element={<AdminRoute><AdminOrders /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

/* ── Wrappers ──────────────────────────────────────────────────────────────── */
function ProductDetailsWrapper({ onNavigate, onViewProduct, showLoader }) {
  /* ProductDetails fetches its own product from MongoDB via useParams(:id) */
  return <ProductDetails onNavigate={onNavigate} onViewProduct={onViewProduct} showLoader={showLoader} />;
}

function CheckoutPageWrapper({ hideLoader }) {
  useEffect(() => { hideLoader(); }, [hideLoader]);
  return <CheckoutPage />;
}

export default App;