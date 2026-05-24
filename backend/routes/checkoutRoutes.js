/**
 * NatureKart — Checkout Routes
 * Address validation + Delivery options
 */
const express = require('express');
const router  = express.Router();

/* ── GET /api/checkout/delivery-options ─────────────────────────────────────
   Returns available delivery types with costs and ETAs
──────────────────────────────────────────────────────────────────────────── */
router.get('/delivery-options', (req, res) => {
  const now = new Date();
  const hour = now.getHours();

  // Same-day only available before 2 PM (14:00)
  const sameDayAvailable = hour < 14;

  const today = new Date();
  today.setHours(20, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const standard = new Date();
  standard.setDate(standard.getDate() + 6);

  const options = [
    {
      id:          'Standard',
      label:       'Standard Delivery',
      description: '5-7 business days',
      cost:        0,
      costLabel:   'FREE',
      eta:         standard.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      available:   true,
      icon:        '📦',
    },
    {
      id:          'One-Day',
      label:       'One-Day Delivery',
      description: 'Delivered by tomorrow',
      cost:        50,
      costLabel:   '+₹50',
      eta:         tomorrow.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      available:   true,
      icon:        '⚡',
    },
    {
      id:          'Same-Day',
      label:       'Same-Day Delivery',
      description: sameDayAvailable
        ? 'Delivered today by 8 PM'
        : 'Not available — order before 2 PM',
      cost:        150,
      costLabel:   '+₹150',
      eta:         sameDayAvailable
        ? today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' by 8 PM'
        : 'Tomorrow by 8 PM',
      available:   true, // still selectable, just show note
      icon:        '🚀',
      note:        !sameDayAvailable ? 'Order after 2 PM — will arrive tomorrow' : null,
    },
  ];

  res.json({ success: true, options });
});

/* ── POST /api/checkout/validate-address ────────────────────────────────────
   Validates pincode format, phone format, required fields
──────────────────────────────────────────────────────────────────────────── */
router.post('/validate-address', (req, res) => {
  const { name, phone, email, address, city, state, pincode } = req.body;
  const errors = {};

  if (!name || name.trim().length < 2)
    errors.name = 'Full name must be at least 2 characters';

  if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '')))
    errors.phone = 'Enter a valid 10-digit Indian mobile number';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter a valid email address';

  if (!address || address.trim().length < 10)
    errors.address = 'Enter complete address (min 10 characters)';

  if (!city || city.trim().length < 2)
    errors.city = 'Enter city name';

  if (!state || state.trim().length < 2)
    errors.state = 'Enter state name';

  if (!pincode || !/^\d{6}$/.test(pincode.trim()))
    errors.pincode = 'Enter a valid 6-digit pincode';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  res.json({ success: true, message: 'Address validated successfully' });
});

module.exports = router;
