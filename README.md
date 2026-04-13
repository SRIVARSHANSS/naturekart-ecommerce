# 🚀 NatureKart - MERN Stack E-Commerce Application

A fully functional MERN Stack e-commerce platform for organic products with smooth animations, cart system, checkout, and order confirmation.

## 📁 Project Structure

```
E-commerse/
├── backend/                 # MERN Backend
│   ├── models/             # MongoDB Models
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/             # API Routes
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   ├── server.js           # Express Server
│   ├── .env                # Environment Variables
│   └── package.json
├── src/
│   ├── components/         # Reusable Components
│   │   ├── Loader.jsx      # Global animated loader
│   │   └── CartPopup.jsx   # Cart notification popup
│   ├── context/
│   │   └── CartContext.jsx # Cart state management
│   └── pages/
│       ├── CartPage.jsx           # Shopping cart
│       ├── CheckoutPage.jsx       # Checkout with payment
│       └── OrderConfirmation.jsx # Order success
├── public/
│   ├── images/              # Product images
│   └── videos/             # Video backgrounds
├── App.jsx                 # Main router
├── main.jsx                # Entry point
└── package.json
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```
- Server runs on **http://localhost:5000**
- MongoDB should be running on localhost:27017

### 2. Frontend Setup

```bash
# In a new terminal
cd E-commerse
npm install
npm run dev
```
- Frontend runs on **http://localhost:5173**

## ✨ Features Implemented

### Frontend
- ✅ **Home Page** - Hero section with video background, featured products
- ✅ **Shop Page** - 60 unique products with filters, video header background
- ✅ **Product Details** - Full product info, add to cart, buy now
- ✅ **Cart System** - Add/remove items, quantity controls, total calculation
- ✅ **Checkout** - Address form, payment simulation (Razorpay UI)
- ✅ **Order Confirmation** - Success page with order ID and delivery estimate

### Animations (Framer Motion)
- ✅ Page transition loader with leaf animation
- ✅ Scroll fade-up animations
- ✅ Hover effects on cards
- ✅ Cart popup animations
- ✅ Button bounce effects

### Backend API
- ✅ GET /api/products - List all products
- ✅ GET /api/products/:id - Get single product
- ✅ POST /api/cart/add - Add to cart
- ✅ GET /api/cart/:userId - Get cart
- ✅ PUT /api/cart/update - Update quantity
- ✅ DELETE /api/cart/remove - Remove item
- ✅ POST /api/orders - Create order
- ✅ GET /api/orders/:orderId - Get order

## 🔄 How to Run

### Option 1: Local Development

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

### Option 2: With MongoDB Atlas

1. Create a MongoDB Atlas account
2. Get your connection string
3. Update backend/.env:
```
MONGO_URI=mongodb+srv://<your-connection-string>
```

## 📱 Navigation Flow

```
Home → Shop → Product Details → Add to Cart → Cart → Checkout → Payment → Order Confirmation
```

## 🎨 Design System

- **Primary Color:** Green (#166534)
- **Secondary:** Emerald (#10b981)
- **Background:** Stone gradient
- **Animations:** Framer Motion

## 📝 Notes

- The frontend uses local state for cart (no backend required for demo)
- Payment is simulated (no real Razorpay integration)
- Products are stored locally in ProductListing.jsx
- For production, connect to MongoDB backend

## 🙏 Acknowledgments

- Video background from public/videos/hero-bg.mp4
- Product images from public/images/
- Framer Motion for animations
- Tailwind CSS for styling
