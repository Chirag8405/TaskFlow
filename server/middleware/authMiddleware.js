const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from Bearer token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user's last seen
      req.user.updateLastSeen();

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Continue without authentication
      req.user = null;
    }
  }

  next();
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
  }
};

// Check if user is project member or owner
const checkProjectAccess = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.id || req.params.projectId || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or member
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project'
      });
    }

    // Attach project to request for later use
    req.project = project;
    next();
  } catch (error) {
    console.error('Project access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization'
    });
  }
};

// Check if user is project owner or admin
const checkProjectOwnership = async (req, res, next) => {
  try {
    const project = req.project; // Should be set by checkProjectAccess

    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found in request'
      });
    }

    // Check if user is owner or admin
    if (!project.isOwner(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only project owner or admin can perform this action'
      });
    }

    next();
  } catch (error) {
    console.error('Project ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization'
    });
  }
};

module.exports = {
  protect,
  optionalAuth,
  adminOnly,
  checkProjectAccess,
  checkProjectOwnership
};