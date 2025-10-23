const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkProject() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const projectId = '68f9f0b2cc97cc0d4a1b841f';
    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      console.log('❌ Project not found!');
      process.exit(1);
    }

    console.log('📋 Project Details:');
    console.log(`  Title: ${project.title}`);
    console.log(`  ID: ${project._id}`);
    console.log(`  Owner: ${project.owner.name} (${project.owner._id})`);
    console.log(`  Members: ${project.members.length}`);
    project.members.forEach((member, i) => {
      console.log(`    ${i + 1}. ${member.name} (${member._id})`);
    });

    console.log('\n🔍 Checking current user...');
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user._id}) - ${user.email}`);
      const isOwner = project.owner._id.toString() === user._id.toString();
      const isMember = project.members.some(m => m._id.toString() === user._id.toString());
      console.log(`    Owner: ${isOwner}, Member: ${isMember}`);
    });

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProject();
