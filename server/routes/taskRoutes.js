const express = require('express');
const router = express.Router();

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { 
  taskSchemas, 
  commentSchemas, 
  idSchema 
} = require('../utils/validationSchemas');

// Import controllers
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  addComment,
  getTaskStats,
  getRecentTasks
} = require('../controllers/taskController');

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', protect, getTaskStats);

// @route   GET /api/tasks/recent
// @desc    Get recent tasks for dashboard
// @access  Private
router.get('/recent', protect, getRecentTasks);

// @route   GET /api/tasks
// @desc    Get tasks for a project
// @access  Private
router.get('/', protect, getTasks);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', protect, validate(taskSchemas.create), createTask);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, validate(idSchema, 'params'), getTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, validate(idSchema, 'params'), validate(taskSchemas.update), updateTask);

// @route   PATCH /api/tasks/:id/move
// @desc    Move task (change status/position)
// @access  Private
router.patch('/:id/move', protect, validate(idSchema, 'params'), validate(taskSchemas.move), moveTask);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', protect, validate(taskSchemas.create), createTask);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, validate(idSchema, 'params'), getTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, validate(idSchema, 'params'), validate(taskSchemas.update), updateTask);

// @route   PATCH /api/tasks/:id/move
// @desc    Move task (change status/position)
// @access  Private
router.patch('/:id/move', protect, validate(idSchema, 'params'), validate(taskSchemas.move), moveTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', protect, validate(idSchema, 'params'), deleteTask);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', protect, validate(idSchema, 'params'), validate(commentSchemas.create), addComment);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', protect, validate(idSchema, 'params'), validate(commentSchemas.create), addComment);

module.exports = router;