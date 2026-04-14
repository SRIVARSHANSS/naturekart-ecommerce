/**
 * NatureKart Admin Setup Script
 * Run: node setup-admin.js <your-email>
 * 
 * This promotes an existing registered user to admin role.
 * Make sure the backend is running first!
 */
const https = require('https');
const http  = require('http');

const email  = process.argv[2];
const secret = 'naturekart_admin_2024';

if (!email) {
  console.error('\n❌  Usage: node setup-admin.js <your-email>\n');
  process.exit(1);
}

const body = JSON.stringify({ email, secret });

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/make-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log(`\n🌿 NatureKart Admin Setup`);
console.log(`   Promoting: ${email}\n`);

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (res.statusCode === 200) {
      console.log(`✅  Success! "${parsed.user.name}" is now an admin.`);
      console.log(`\n📋  Next steps:`);
      console.log(`   1. Open http://localhost:5173`);
      console.log(`   2. Log in with: ${email}`);
      console.log(`   3. Double-click the 🌿 NatureKart logo to open Admin Panel\n`);
    } else {
      console.error(`❌  Failed: ${parsed.message}`);
      if (res.statusCode === 404) console.log(`   → Register at http://localhost:5173/register first`);
    }
  });
});

req.on('error', () => {
  console.error('❌  Cannot connect to backend. Make sure it is running on port 5001.');
});

req.write(body);
req.end();
