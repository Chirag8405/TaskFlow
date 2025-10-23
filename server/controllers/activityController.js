const Activity = require('../models/Activity');
const Project = require('../models/Project');

// @desc    Get activities for user's projects
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
  try {
    const { limit = 20, project } = req.query;

    let activities;

    if (project) {
      // Get activities for specific project
      activities = await Activity.find({ project })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('user', 'username email avatar')
        .populate('project', 'name color')
        .populate('task', 'title status priority');
    } else {
      // Get activities for all user's projects
      const userProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      }).select('_id');

      const projectIds = userProjects.map(p => p._id);

      activities = await Activity.getProjectActivities(projectIds, parseInt(limit));
    }

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

// @desc    Get recent activities
// @route   GET /api/activities/recent
// @access  Private
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get user's projects
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    const activities = await Activity.getProjectActivities(projectIds, parseInt(limit));

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
};

// @desc    Log activity (internal use)
const logActivity = async (data) => {
  try {
    return await Activity.logActivity(data);
  } catch (error) {
    console.error('Log activity error:', error);
    return null;
  }
};

module.exports = {
  getActivities,
  getRecentActivities,
  logActivity
};
