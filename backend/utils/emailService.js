/**
 * NatureKart — Email Service (Nodemailer + Gmail)
 * Sends OTP emails for registration and password reset
 */
const nodemailer = require('nodemailer');

const createTransport = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

/* ── OTP Email Template ─────────────────────────────────────────────────────── */
const otpHtml = (otp, title, subtitle) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:20px;overflow:hidden;
                 box-shadow:0 4px 32px rgba(0,0,0,0.08);border:1px solid #d1fae5;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#14532d,#059669);
                       padding:36px 40px 28px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🌿</div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                Nature<span style="color:#6ee7b7;">Kart</span>
              </h1>
              <p style="color:#a7f3d0;margin:6px 0 0;font-size:14px;">${subtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;font-weight:700;">
                ${title}
              </h2>
              <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 28px;">
                Use the verification code below. It expires in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="text-align:center;margin:0 0 32px;">
                <div style="display:inline-block;background:#f0fdf4;border:2px solid #6ee7b7;
                            border-radius:16px;padding:24px 48px;">
                  <span style="font-size:40px;font-weight:900;letter-spacing:12px;
                               color:#064e3b;font-family:monospace;">${otp}</span>
                </div>
              </div>

              <p style="color:#78716c;font-size:13px;line-height:1.6;margin:0;">
                ⚠️ Never share this code with anyone. NatureKart will never ask for your OTP.<br/>
                If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e7e5e4;
                       padding:20px 40px;text-align:center;">
              <p style="color:#a8a29e;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} NatureKart — India's Premium Organic Wellness Store<br/>
                <a href="mailto:naturekartnoreply@gmail.com"
                   style="color:#059669;text-decoration:none;">naturekartnoreply@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ── Send OTP for email verification ────────────────────────────────────────── */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"NatureKart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🌿 Verify your NatureKart account — OTP inside',
    html: otpHtml(otp, 'Verify Your Email Address', 'Account Verification'),
  });
};

/* ── Send OTP for password reset ────────────────────────────────────────────── */
const sendPasswordResetEmail = async (email, otp) => {
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"NatureKart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 NatureKart Password Reset OTP',
    html: otpHtml(otp, 'Reset Your Password', 'Password Reset Request'),
  });
};

/* ── Generate 6-digit OTP ───────────────────────────────────────────────────── */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ── Return & Refund Email Template ────────────────────────────────────────── */
const returnHtml = (title, body, status, trackingInfo = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:20px;overflow:hidden;
                 box-shadow:0 4px 32px rgba(0,0,0,0.08);border:1px solid #d1fae5;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#14532d,#059669);
                       padding:36px 40px 28px;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px;">🌿</div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                Nature<span style="color:#6ee7b7;">Kart</span>
              </h1>
              <p style="color:#a7f3d0;margin:6px 0 0;font-size:14px;">Return & Refund Management</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="color:#1c1917;margin:0 0 12px;font-size:20px;font-weight:700;">
                ${title}
              </h2>
              <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0;border-left:4px solid #059669;">
                <p style="margin:0 0 8px;font-size:14px;color:#78716c;"><strong>Request Status:</strong> <span style="color:#059669;font-weight:bold;">${status}</span></p>
                ${trackingInfo}
              </div>
              <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 28px;">
                ${body}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e7e5e4;
                       padding:20px 40px;text-align:center;">
              <p style="color:#a8a29e;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} NatureKart — Premium Organic Wellness Store<br/>
                <a href="mailto:naturekartnoreply@gmail.com"
                   style="color:#059669;text-decoration:none;">naturekartnoreply@gmail.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ── Send Return Status / Update Email ─────────────────────────────────────── */
const sendReturnEmail = async (email, subject, title, body, status, trackingInfo = '') => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `"NatureKart" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌿 NatureKart: ${subject}`,
      html: returnHtml(title, body, status, trackingInfo),
    });
  } catch (err) {
    console.error('❌ Error sending return email:', err.message);
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail, generateOTP, sendReturnEmail };
