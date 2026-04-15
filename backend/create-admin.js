/**
 * NatureKart — Create Admin Account Directly
 * Usage: node create-admin.js  (run from backend/ folder)
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/naturekart';

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

  let user = await User.findOne({ email });

  if (user) {
    user.role = 'admin';
    await user.save();
    console.log('✅ Existing user promoted to admin!');
  } else {
    const hashed = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hashed, role: 'admin' });
    console.log('✅ New admin account created!');
  }

  console.log('\n📋  Admin Credentials:');
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log('\n🚀  Steps:');
  console.log('   1. Open → http://localhost:5173/login');
  console.log('   2. Login with above credentials');
  console.log('   3. Double-click the 🌿 NatureKart logo → Admin Panel opens!\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
