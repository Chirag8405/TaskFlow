const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { NotificationService } = require('../services/notificationService');
const { logActivity } = require('./activityController');

// @desc    Get tasks for a project
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const {
      project: projectId,
      status,
      assignedTo,
      priority,
      search,
      page = 1,
      limit = 50,
      sort = 'position'
    } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Build filters object
    const filters = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (priority) filters.priority = priority;
    if (search) filters.search = search;

    // Get tasks
    const tasks = await Task.findByProject(projectId, filters);

    // Apply pagination if needed
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedTasks = tasks.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        tasks: paginatedTasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: tasks.length,
          pages: Math.ceil(tasks.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this task'
      });
    }

    res.json({
      success: true,
      data: {
        task
      }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      dueDate,
      tags,
      status = 'todo'
    } = req.body;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    // Validate assignedTo user if provided
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }

      // Automatically add user to project if not already a member
      if (!project.isMember(assignedTo)) {
        project.addMember(assignedTo);
        await project.save();
      }
    }

    // Get the highest position for this project and status
    const lastTask = await Task.findOne({ project: projectId, status })
      .sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    // Create task
    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority,
      dueDate: dueDate || null,
      tags: tags || [],
      status,
      position
    });

    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('task-created', populatedTask);
    }

    // Send notification if task is assigned to someone
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      try {
        await NotificationService.notifyTaskAssigned(
          populatedTask,
          assignedTo,
          req.user
        );
      } catch (notificationError) {
        console.error('Failed to send task assignment notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Log activity
    await logActivity({
      type: 'task_created',
      description: 'created a task',
      user: req.user._id,
      project: projectId,
      task: task._id,
      metadata: {
        taskTitle: title,
        projectTitle: project.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: populatedTask
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      tags,
      status
    } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this task'
      });
    }

    // Validate assignedTo user if provided
    if (assignedTo !== undefined) {
      if (assignedTo) {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user not found'
          });
        }

        if (!project.isMember(assignedTo)) {
          return res.status(400).json({
            success: false,
            message: 'Assigned user is not a member of this project'
          });
        }
      }
      task.assignedTo = assignedTo;
    }

    // Update fields if provided
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;
    if (status) task.status = status;

    const updatedTask = await task.save();

    // Populate the updated task
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(task.project.toString()).emit('task-updated', populatedTask);
    }

    // Send notifications for task updates
    try {
      // Track what was changed for the notification
      const changes = [];
      if (title && title !== task.title) changes.push(`Title changed to "${title}"`);
      if (status && status !== task.status) changes.push(`Status changed to "${status}"`);
      if (priority && priority !== task.priority) changes.push(`Priority changed to "${priority}"`);
      if (assignedTo !== undefined && assignedTo !== task.assignedTo?.toString()) {
        if (assignedTo) {
          const assignedUser = await User.findById(assignedTo);
          changes.push(`Assigned to ${assignedUser.name}`);
          
          // Notify newly assigned user
          await NotificationService.notifyTaskAssigned(
            populatedTask,
            assignedTo,
            req.user
          );
        } else {
          changes.push('Assignment removed');
        }
      }

      // Notify original assignee about updates (if not the person making the update)
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString() && changes.length > 0) {
        await NotificationService.notifyTaskUpdated(
          populatedTask,
          req.user,
          changes
        );
      }

      // Check if task was completed
      if (status === 'completed' && task.status !== 'completed') {
        await NotificationService.notifyTaskCompleted(
          populatedTask,
          req.user
        );
      }
    } catch (notificationError) {
      console.error('Failed to send task update notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    // Log activity
    const activityType = status === 'done' && task.status !== 'done' ? 'task_completed' : 'task_updated';
    await logActivity({
      type: activityType,
      description: activityType === 'task_completed' ? 'completed a task' : 'updated a task',
      user: req.user._id,
      project: task.project,
      task: task._id,
      metadata: {
        taskTitle: task.title,
        projectTitle: project.name,
        oldStatus: task.status,
        newStatus: status || task.status,
        oldPriority: task.priority,
        newPriority: priority || task.priority
      }
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: populatedTask
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task'
    });
  }
};

// @desc    Move task (change status and position)
// @route   PATCH /api/tasks/:id/move
// @access  Private
const moveTask = async (req, res) => {
  try {
    const { newStatus, newPosition } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this task'
      });
    }

    const oldStatus = task.status;
    const oldPosition = task.position;

    // Update task status and position
    task.status = newStatus;
    task.position = newPosition !== undefined ? newPosition : task.position;

    const updatedTask = await task.save();

    // Populate the updated task
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(task.project.toString()).emit('task-moved', {
        task: populatedTask,
        oldStatus,
        newStatus,
        oldPosition,
        newPosition
      });
    }

    res.json({
      success: true,
      message: 'Task moved successfully',
      data: {
        task: populatedTask
      }
    });
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while moving task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this task'
      });
    }

    // Only task creator, project owner, or admin can delete
    if (task.createdBy.toString() !== req.user._id.toString() && 
        !project.isOwner(req.user._id) && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only task creator, project owner, or admin can delete this task'
      });
    }

    await task.deleteOne();

    // Log activity
    await logActivity({
      type: 'task_deleted',
      description: 'deleted a task',
      user: req.user._id,
      project: task.project,
      metadata: {
        taskTitle: task.title,
        projectTitle: project.name
      }
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(task.project.toString()).emit('task-deleted', task._id);
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task'
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this task'
      });
    }

    // Add comment
    await task.addComment(req.user._id, text);

    // Get updated task with populated comments
    const updatedTask = await Task.findById(task._id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(task.project.toString()).emit('task-comment-added', {
        taskId: task._id,
        comment: updatedTask.comments[updatedTask.comments.length - 1]
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        task: updatedTask
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment'
    });
  }
};

// @desc    Get task statistics for dashboard
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const { projectId } = req.query;

    let query = {};

    if (projectId) {
      // Check if user has access to the project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      if (!project.isMember(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this project'
        });
      }

      query.project = projectId;
    } else {
      // Get stats for all projects user has access to
      const userProjects = await Project.find({
        $or: [
          { owner: req.user._id },
          { members: req.user._id }
        ]
      });

      query.project = { $in: userProjects.map(p => p._id) };
    }

    const stats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
          inprogress: { $sum: { $cond: [{ $eq: ['$status', 'inprogress'] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          assignedToMe: {
            $sum: {
              $cond: [
                { $eq: ['$assignedTo', req.user._id] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      todo: 0,
      inprogress: 0,
      done: 0,
      high: 0,
      medium: 0,
      low: 0,
      overdue: 0,
      assignedToMe: 0
    };

    res.json({
      success: true,
      data: {
        stats: result
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task statistics'
    });
  }
};

// @desc    Get recent tasks for dashboard
// @route   GET /api/tasks/recent
// @access  Private
const getRecentTasks = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get projects user has access to
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id }
      ]
    });

    if (userProjects.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const projectIds = userProjects.map(p => p._id);

    // Get recent tasks from user's projects
    const recentTasks = await Task.find({
      project: { $in: projectIds }
    })
      .populate('project', 'title color')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: recentTasks
    });
  } catch (error) {
    console.error('Get recent tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent tasks'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
  getTaskStats,
  getRecentTasks
};