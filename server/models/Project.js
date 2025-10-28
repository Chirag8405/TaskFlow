const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Project title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Project description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  color: {
    type: String,
    default: '#4F46E5', // Default indigo color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  }
}, {
  timestamps: true
});

// Compound index for owner and status
projectSchema.index({ owner: 1, status: 1 });

// Index for member lookup
projectSchema.index({ members: 1 });

// Virtual for task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Instance method to check if user is member or owner
projectSchema.methods.isMember = function(userId) {
  return this.owner.toString() === userId.toString() || 
         this.members.some(member => member.toString() === userId.toString());
};

// Instance method to check if user is owner
projectSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

// Instance method to add member
projectSchema.methods.addMember = function(userId) {
  if (!this.isMember(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

// Instance method to remove member
projectSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.toString() !== userId.toString());
  return this.save();
};

// Static method to find projects for user
projectSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { members: userId }
    ],
    status: { $ne: 'archived' }
  }).populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ updatedAt: -1 });
};

// Static method to find active projects for user
projectSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { members: userId }
    ],
    status: 'active'
  }).populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ updatedAt: -1 });
};

// Pre-save middleware to add owner to members array
projectSchema.pre('save', function(next) {
  // Add owner to members if not already present
  if (this.isNew && !this.members.includes(this.owner)) {
    this.members.push(this.owner);
  }
  next();
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Project', projectSchema);