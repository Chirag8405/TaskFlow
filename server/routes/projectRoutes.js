const express = require('express');
const router = express.Router();

// Import middleware
const { protect, checkProjectAccess, checkProjectOwnership } = require('../middleware/authMiddleware');
const { 
  validate, 
  sanitizeInput, 
  validateObjectId 
} = require('../middleware/validationMiddleware');
const { projectSchemas, querySchemas } = require('../utils/validationSchemas');

// Import controllers
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/projectController');

// @route   GET /api/projects
// @desc    Get all projects for user
// @access  Private
router.get('/', 
  protect, 
  validate(querySchemas.pagination, 'query'),
  getProjects
);

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', 
  protect, 
  sanitizeInput,
  validate(projectSchemas.create),
  createProject
);

// @route   GET /api/projects/:id
// @desc    Get single project with tasks
// @access  Private
router.get('/:id', 
  protect, 
  validateObjectId('id'), 
  checkProjectAccess, 
  getProject
);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Owner/Admin only)
router.put('/:id', 
  protect, 
  validateObjectId('id'), 
  checkProjectAccess, 
  checkProjectOwnership, 
  validate(projectSchemas.update), 
  updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Owner/Admin only)
router.delete('/:id', protect, validateObjectId('id'), checkProjectAccess, checkProjectOwnership, deleteProject);

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private (Owner/Admin only)
router.post('/:id/members', protect, validateObjectId('id'), checkProjectAccess, checkProjectOwnership, [
  require('express-validator').body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID')
], validate, addMember);

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private (Owner/Admin or self)
router.delete('/:id/members/:userId', 
  protect, 
  validateObjectId('id'), 
  validateObjectId('userId'), 
  checkProjectAccess, 
  removeMember
);

module.exports = router;