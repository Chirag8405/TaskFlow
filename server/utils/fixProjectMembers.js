const mongoose = require('mongoose');
const Project = require('../models/Project');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Migration script to ensure all project owners are also members
 * This fixes the 403 error where owners couldn't access their own projects
 */
async function fixProjectMembers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all projects where owner is not in members array
    const projects = await Project.find({});
    
    let fixedCount = 0;
    
    for (const project of projects) {
      const ownerId = project.owner.toString();
      const isMember = project.members.some(
        member => member.toString() === ownerId
      );
      
      if (!isMember) {
        project.members.push(project.owner);
        await project.save();
        fixedCount++;
        console.log(`✓ Fixed project: ${project.title} (${project._id})`);
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Total projects: ${projects.length}`);
    console.log(`   Fixed projects: ${fixedCount}`);
    console.log(`   Already correct: ${projects.length - fixedCount}`);
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixProjectMembers();
