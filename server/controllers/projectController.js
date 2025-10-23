const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { logActivity } = require('./activityController');

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      search = '',
      sort = '-updatedAt'
    } = req.query;

    // Build query
    const query = {
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'title') sortObj.title = 1;
    else if (sort === '-title') sortObj.title = -1;
    else if (sort === 'createdAt') sortObj.createdAt = 1;
    else if (sort === '-createdAt') sortObj.createdAt = -1;
    else if (sort === 'updatedAt') sortObj.updatedAt = 1;
    else if (sort === '-updatedAt') sortObj.updatedAt = -1;
    else sortObj.updatedAt = -1; // default

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await Task.getProjectStats(project._id);
        return {
          ...project.toJSON(),
          stats: taskStats[0] || {
            total: 0,
            todo: 0,
            inprogress: 0,
            done: 0,
            high: 0,
            medium: 0,
            low: 0,
            overdue: 0
          }
        };
      })
    );

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Access already checked by checkProjectAccess middleware

    // Get project tasks
    const tasks = await Task.findByProject(project._id);

    // Get project statistics
    const stats = await Task.getProjectStats(project._id);

    res.json({
      success: true,
      data: {
        project: {
          ...project.toJSON(),
          stats: stats[0] || {
            total: 0,
            todo: 0,
            inprogress: 0,
            done: 0,
            high: 0,
            medium: 0,
            low: 0,
            overdue: 0
          }
        },
        tasks
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description, color, members } = req.body;

    // Validate members if provided
    let memberIds = [req.user._id]; // Always include owner as a member
    if (members && Array.isArray(members)) {
      // Validate that all member IDs exist
      const existingUsers = await User.find({ _id: { $in: members } });
      if (existingUsers.length !== members.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more member IDs are invalid'
        });
      }
      // Add other members (avoid duplicates)
      members.forEach(memberId => {
        if (!memberIds.includes(memberId)) {
          memberIds.push(memberId);
        }
      });
    }

    const project = await Project.create({
      title,
      description,
      color,
      owner: req.user._id,
      members: memberIds
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Notify all members about the new project
      memberIds.forEach(memberId => {
        io.to(memberId.toString()).emit('project-created', populatedProject);
      });
    }

    // Log activity
    await logActivity({
      type: 'project_created',
      description: 'created a project',
      user: req.user._id,
      project: project._id,
      metadata: {
        projectTitle: title
      }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: populatedProject
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const { title, description, color, status } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (!project.isOwner(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or admin can update project'
      });
    }

    // Update fields if provided
    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (status) project.status = status;

    const updatedProject = await project.save();
    
    const populatedProject = await Project.findById(updatedProject._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('project-updated', populatedProject);
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: populatedProject
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (!project.isOwner(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or admin can delete project'
      });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: project._id });

    // Delete the project
    await project.deleteOne();

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('project-deleted', project._id);
    }

    res.json({
      success: true,
      message: 'Project and associated tasks deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project'
    });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (!project.isOwner(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only project owner or admin can add members'
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member
    if (project.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    await project.addMember(userId);

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('member-added', {
        project: updatedProject,
        newMember: userToAdd
      });
      io.to(userId).emit('project-invitation', updatedProject);
    }

    res.json({
      success: true,
      message: 'Member added successfully',
      data: {
        project: updatedProject
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member'
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin, or user is removing themselves
    if (!project.isOwner(req.user._id) && req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot remove project owner
    if (project.isOwner(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    // Remove member
    await project.removeMember(userId);

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('member-removed', {
        project: updatedProject,
        removedMemberId: userId
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: {
        project: updatedProject
      }
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
};