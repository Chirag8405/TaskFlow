const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'task_created',
        'task_updated',
        'task_deleted',
        'task_completed',
        'task_reopened',
        'task_assigned',
        'project_created',
        'project_updated',
        'project_deleted',
        'user_joined',
        'comment_added',
        'file_uploaded'
      ]
    },
    description: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    metadata: {
      taskTitle: String,
      projectTitle: String,
      oldStatus: String,
      newStatus: String,
      oldPriority: String,
      newPriority: String,
      assignedTo: String,
      changes: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

// Static method to create activity
activitySchema.statics.logActivity = async function(data) {
  try {
    const activity = await this.create(data);
    return await activity.populate('user', 'username email avatar');
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = async function(options = {}) {
  const {
    limit = 20,
    user = null,
    project = null,
    task = null
  } = options;

  const query = {};
  if (user) query.user = user;
  if (project) query.project = project;
  if (task) query.task = task;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username email avatar')
    .populate('project', 'name color')
    .populate('task', 'title status priority');
};

// Static method to get activities for user's projects
activitySchema.statics.getProjectActivities = async function(projectIds, limit = 20) {
  return await this.find({ project: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username email avatar')
    .populate('project', 'name color')
    .populate('task', 'title status priority');
};

module.exports = mongoose.model('Activity', activitySchema);
