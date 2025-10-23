#!/usr/bin/env node

/**
 * Script to list all users with their roles
 * Usage: node scripts/listUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/realtime_task_manager');
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('name email role createdAt');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      process.exit(0);
    }

    console.log(`📋 Total Users: ${users.length}\n`);
    console.log('─'.repeat(80));
    console.log('Name'.padEnd(25) + 'Email'.padEnd(30) + 'Role'.padEnd(15) + 'Created');
    console.log('─'.repeat(80));

    users.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👑' : '👤';
      const name = user.name.padEnd(23);
      const email = user.email.padEnd(28);
      const role = (roleIcon + ' ' + user.role).padEnd(15);
      const created = new Date(user.createdAt).toLocaleDateString();
      
      console.log(`${name} ${email} ${role} ${created}`);
    });

    console.log('─'.repeat(80));
    
    const adminCount = users.filter(u => u.role === 'admin').length;
    const memberCount = users.filter(u => u.role === 'member').length;
    
    console.log(`\n👑 Admins: ${adminCount}`);
    console.log(`👤 Members: ${memberCount}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
};

listUsers();
