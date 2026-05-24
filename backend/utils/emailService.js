/**
 * NatureKart — Email Service (Nodemailer + Gmail)
 * Complete email suite: OTP, order confirmation, shipping, delivery OTP,
 * return OTP, refund emails
 */
const nodemailer = require('nodemailer');

const createTransport = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

/* ── Generate 6-digit OTP ───────────────────────────────────────────────────── */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ── Shared header/footer partials ─────────────────────────────────────────── */
const emailHeader = (subtitle = '') => `
<!DOCTYPE html><html><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#ffffff;border-radius:20px;overflow:hidden;
         box-shadow:0 4px 32px rgba(0,0,0,0.08);border:1px solid #d1fae5;">
  <tr>
    <td style="background:linear-gradient(135deg,#14532d,#059669);padding:32px 40px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:6px;">🌿</div>
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
        Nature<span style="color:#6ee7b7;">Kart</span>
      </h1>
      <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px;">${subtitle}</p>
    </td>
  </tr>
  <tr><td style="padding:32px 40px 24px;">`;

const emailFooter = () => `
  </td></tr>
  <tr>
    <td style="background:#f9fafb;border-top:1px solid #e7e5e4;padding:18px 40px;text-align:center;">
      <p style="color:#a8a29e;font-size:12px;margin:0;">
        © ${new Date().getFullYear()} NatureKart — India's Premium Organic Wellness Store<br/>
        <a href="mailto:naturekartnoreply@gmail.com" style="color:#059669;text-decoration:none;">naturekartnoreply@gmail.com</a>
      </p>
    </td>
  </tr>
</table></td></tr></table></body></html>`;

const otpBox = (otp) => `
<div style="text-align:center;margin:24px 0;">
  <div style="display:inline-block;background:#f0fdf4;border:2px solid #6ee7b7;
              border-radius:16px;padding:20px 44px;">
    <span style="font-size:40px;font-weight:900;letter-spacing:10px;
                 color:#064e3b;font-family:monospace;">${otp}</span>
  </div>
  <p style="color:#78716c;font-size:12px;margin:10px 0 0;">
    ⚠️ Valid for 30 minutes. Never share this OTP with anyone.
  </p>
</div>`;

/* ── OTP Email (registration / password reset) ───────────────────────────── */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"NatureKart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🌿 Verify your NatureKart account — OTP inside',
    html: emailHeader('Account Verification') +
      `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">Verify Your Email Address</h2>
       <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 20px;">
         Use the code below to verify your account. It expires in <strong>10 minutes</strong>.
       </p>` + otpBox(otp) + emailFooter(),
  });
};

/* ── Password Reset OTP ──────────────────────────────────────────────────── */
const sendPasswordResetEmail = async (email, otp) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"NatureKart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 NatureKart Password Reset OTP',
    html: emailHeader('Password Reset Request') +
      `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">Reset Your Password</h2>
       <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 20px;">
         Use the code below to reset your password. It expires in <strong>10 minutes</strong>.
       </p>` + otpBox(otp) + emailFooter(),
  });
};

/* ── Order Confirmation Email ────────────────────────────────────────────── */
const sendOrderConfirmationEmail = async (
  email, customerName, orderId, invoiceNumber,
  items, totalAmount, shippingCost, estimatedDelivery, paymentMethod, paymentId
) => {
  try {
    const transporter = createTransport();
    const itemRows = items.map(i =>
      `<tr>
         <td style="padding:8px 0;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;">${i.name}</td>
         <td style="padding:8px 0;font-size:14px;color:#374151;text-align:center;border-bottom:1px solid #f3f4f6;">×${i.quantity}</td>
         <td style="padding:8px 0;font-size:14px;font-weight:700;color:#059669;text-align:right;border-bottom:1px solid #f3f4f6;">₹${(i.price * i.quantity).toLocaleString()}</td>
       </tr>`
    ).join('');

    const etaStr = estimatedDelivery
      ? new Date(estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
      : '5-7 business days';

    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Order Confirmed! #${orderId} — NatureKart`,
      html: emailHeader('Order Confirmed') +
        `<h2 style="color:#1c1917;margin:0 0 4px;font-size:22px;font-weight:800;">Order Confirmed! 🎉</h2>
         <p style="color:#57534e;font-size:15px;margin:0 0 20px;">Hi ${customerName}, thank you for your order!</p>

         <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:20px;border-left:4px solid #059669;">
           <p style="margin:0 0 6px;font-size:13px;color:#78716c;"><strong>Order ID:</strong> <span style="font-family:monospace;font-weight:700;color:#059669;">${orderId}</span></p>
           <p style="margin:0 0 6px;font-size:13px;color:#78716c;"><strong>Invoice:</strong> ${invoiceNumber}</p>
           <p style="margin:0 0 6px;font-size:13px;color:#78716c;"><strong>Payment:</strong> ${paymentMethod} (${paymentId})</p>
           <p style="margin:0;font-size:13px;color:#78716c;"><strong>Est. Delivery:</strong> ${etaStr}</p>
         </div>

         <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
           <tr style="background:#f9fafb;">
             <th style="padding:8px 0;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;">Item</th>
             <th style="padding:8px 0;font-size:12px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;">Qty</th>
             <th style="padding:8px 0;font-size:12px;color:#6b7280;text-align:right;font-weight:600;text-transform:uppercase;">Price</th>
           </tr>
           ${itemRows}
         </table>

         <div style="border-top:2px solid #d1fae5;padding-top:12px;">
           ${shippingCost > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-size:14px;color:#6b7280;">Shipping</span><span style="font-size:14px;color:#374151;">₹${shippingCost}</span></div>` : ''}
           <div style="display:flex;justify-content:space-between;"><span style="font-size:16px;font-weight:800;color:#1c1917;">Total</span><span style="font-size:18px;font-weight:800;color:#059669;">₹${totalAmount.toLocaleString()}</span></div>
         </div>` +
        emailFooter(),
    });
  } catch (err) {
    console.error('Order confirmation email error:', err.message);
  }
};

/* ── Order Shipped Email ─────────────────────────────────────────────────── */
const sendShippedEmail = async (email, customerName, orderId) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🚚 Your NatureKart Order #${orderId} Has Been Shipped!`,
      html: emailHeader('Shipment Update') +
        `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">Your Order is on the Way! 🚚</h2>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 20px;">
           Hi ${customerName}! Great news — your order <strong>#${orderId}</strong> has been shipped
           and is heading your way.
         </p>
         <div style="background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:20px;border-left:4px solid #3b82f6;">
           <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">📦 Track your order using Order ID: <span style="font-family:monospace;">${orderId}</span></p>
         </div>
         <p style="color:#78716c;font-size:14px;line-height:1.6;margin:0;">
           You'll receive another update when your order is out for delivery. Our delivery agent
           will share a delivery OTP to confirm successful handover.
         </p>` +
        emailFooter(),
    });
  } catch (err) {
    console.error('Shipped email error:', err.message);
  }
};

/* ── Delivery OTP Email ──────────────────────────────────────────────────── */
const sendDeliveryOtpEmail = async (email, customerName, otp, orderId) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 Delivery OTP for Order #${orderId} — NatureKart`,
      html: emailHeader('Delivery Verification') +
        `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">Delivery OTP for Your Order</h2>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 8px;">
           Hi ${customerName}! Your order <strong>#${orderId}</strong> is about to be delivered.
         </p>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 20px;">
           Share the OTP below with our delivery agent to confirm receipt:
         </p>` +
        otpBox(otp) +
        `<p style="color:#78716c;font-size:14px;line-height:1.6;margin:16px 0 0;">
           ✅ Only share this OTP with our official NatureKart delivery agent.<br/>
           🛡️ NatureKart staff will <strong>never</strong> ask for this OTP over phone or email.
         </p>` +
        emailFooter(),
    });
  } catch (err) {
    console.error('Delivery OTP email error:', err.message);
  }
};

/* ── Return OTP Email ────────────────────────────────────────────────────── */
const sendReturnOtpEmail = async (email, customerName, otp, orderId) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔐 Return Confirmation OTP for Order #${orderId} — NatureKart`,
      html: emailHeader('Return Verification') +
        `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">Return Pickup Verified</h2>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 8px;">
           Hi ${customerName}! We have received your returned product for order <strong>#${orderId}</strong>.
         </p>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 20px;">
           Share this OTP with our team to confirm the return and initiate your refund:
         </p>` +
        otpBox(otp) +
        `<div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-top:20px;border-left:4px solid #059669;">
           <p style="margin:0;font-size:14px;color:#065f46;font-weight:600;">
             💰 After OTP verification, your refund will be processed within <strong>7 business days</strong>.
           </p>
         </div>` +
        emailFooter(),
    });
  } catch (err) {
    console.error('Return OTP email error:', err.message);
  }
};

/* ── Return Status / Update Email ────────────────────────────────────────── */
const sendReturnEmail = async (email, subject, title, body, status, trackingInfo = '') => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌿 NatureKart: ${subject}`,
      html: emailHeader('Return & Refund Management') +
        `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">${title}</h2>
         <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0;border-left:4px solid #059669;">
           <p style="margin:0 0 6px;font-size:14px;color:#78716c;"><strong>Status:</strong> <span style="color:#059669;font-weight:bold;">${status}</span></p>
           ${trackingInfo}
         </div>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0;">${body}</p>` +
        emailFooter(),
    });
  } catch (err) {
    console.error('Return email error:', err.message);
  }
};

/* ── Refund Initiated Email ──────────────────────────────────────────────── */
const sendRefundInitiatedEmail = async (email, customerName, orderId, refundAmount, refundMethod) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `💰 Refund Initiated for Order #${orderId} — NatureKart`,
      html: emailHeader('Refund Confirmation') +
        `<h2 style="color:#1c1917;margin:0 0 10px;font-size:20px;font-weight:700;">Your Refund Has Been Initiated! 💰</h2>
         <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 20px;">
           Hi ${customerName}! Great news — your refund for order <strong>#${orderId}</strong> has been initiated.
         </p>
         <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:20px;border:2px solid #6ee7b7;">
           <p style="margin:0 0 8px;font-size:14px;color:#78716c;"><strong>Refund Amount:</strong> <span style="font-size:20px;font-weight:800;color:#059669;">₹${refundAmount.toLocaleString()}</span></p>
           <p style="margin:0 0 8px;font-size:14px;color:#78716c;"><strong>Refund Method:</strong> ${refundMethod}</p>
           <p style="margin:0;font-size:14px;color:#78716c;"><strong>Timeline:</strong> 5-7 business days</p>
         </div>
         <p style="color:#78716c;font-size:14px;line-height:1.6;margin:0;">
           The refund will reflect in your account within 5-7 business days depending on your bank.
           For any queries, contact us at naturekartnoreply@gmail.com
         </p>` +
        emailFooter(),
    });
  } catch (err) {
    console.error('Refund email error:', err.message);
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendShippedEmail,
  sendDeliveryOtpEmail,
  sendReturnOtpEmail,
  sendReturnEmail,
  sendRefundInitiatedEmail,
};
