#!/usr/bin/env node

/**
 * Script to promote a user to admin role
 * Usage: node scripts/promoteToAdmin.js <email>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const promoteToAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/realtime_task_manager');
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    // Check if already admin
    if (user.role === 'admin') {
      console.log(`ℹ️  User "${user.name}" (${user.email}) is already an admin`);
      process.exit(0);
    }

    // Promote to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ Success!');
    console.log(`👤 User: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🎖️  Role: ${user.role}`);
    console.log('');
    console.log('The user has been promoted to admin.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/promoteToAdmin.js <email>');
  console.log('Example: node scripts/promoteToAdmin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email);
