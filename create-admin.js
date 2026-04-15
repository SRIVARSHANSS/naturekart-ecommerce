/**
 * NatureKart — Create Admin Account Directly
 * Usage: node create-admin.js
 * Creates admin user: admin@naturekart.com / Admin@123
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/naturekart';

/* Inline schemas so we don't need the full backend */
const userSchema = new mongoose.Schema({
  name:      String,
  email:     { type: String, unique: true },
  password:  String,
  phone:     { type: String, default: '' },
  role:      { type: String, default: 'user' },
  addresses: [],
}, { timestamps: true });

async function main() {
  console.log('\n🌿 NatureKart — Admin Account Setup\n');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const User = mongoose.model('User', userSchema);

  const email    = 'admin@naturekart.com';
  const password = 'Admin@123';
  const name     = 'Admin';

  /* Check if already exists */
  let user = await User.findOne({ email });

  if (user) {
    /* Promote existing to admin */
    user.role = 'admin';
    await user.save();
    console.log(`\n✅ Existing user promoted to admin!`);
  } else {
    /* Create new admin user */
    const hashed = await bcrypt.hash(password, 12);
    user = await User.create({ name, email, password: hashed, role: 'admin' });
    console.log(`\n✅ Admin account created!`);
  }

  console.log(`\n📋  Admin Credentials:`);
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n📋  How to access Admin Panel:`);
  console.log(`   1. Open  → http://localhost:5173/login`);
  console.log(`   2. Login with above credentials`);
  console.log(`   3. Double-click the 🌿 NatureKart logo (top-left)`);
  console.log(`      OR go to → http://localhost:5173/admin/dashboard\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
