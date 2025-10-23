const { Role, Organization, Team } = require('../models/UserManagement');
const User = require('../models/User');

// Permission constants
const PERMISSIONS = {
  RESOURCES: {
    PROJECTS: 'projects',
    TASKS: 'tasks',
    USERS: 'users',
    TEAMS: 'teams',
    SETTINGS: 'settings',
    ANALYTICS: 'analytics',
    NOTIFICATIONS: 'notifications'
  },
  ACTIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage',
    INVITE: 'invite',
    EXPORT: 'export'
  }
};

// Extract context from request
const extractContext = (req) => {
  const context = {};
  
  // Extract organization ID from various sources
  if (req.params.organizationId) {
    context.organizationId = req.params.organizationId;
  } else if (req.body.organizationId) {
    context.organizationId = req.body.organizationId;
  } else if (req.query.organizationId) {
    context.organizationId = req.query.organizationId;
  }
  
  // Extract team ID from various sources
  if (req.params.teamId) {
    context.teamId = req.params.teamId;
  } else if (req.body.teamId) {
    context.teamId = req.body.teamId;
  } else if (req.query.teamId) {
    context.teamId = req.query.teamId;
  }
  
  // Extract project ID for team context lookup
  if (req.params.projectId) {
    context.projectId = req.params.projectId;
  } else if (req.body.projectId) {
    context.projectId = req.body.projectId;
  }
  
  return context;
};

// Check if user has required permission
const hasPermission = (requiredResource, requiredAction, options = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const context = extractContext(req);
      const { allowOwner = false, allowSelf = false } = options;

      // Super admin has all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user is the owner of the resource (for self-management)
      if (allowSelf && req.params.userId === user._id.toString()) {
        return next();
      }

      // If project context is provided, get team/organization context
      if (context.projectId && !context.teamId && !context.organizationId) {
        const Project = require('../models/Project');
        const project = await Project.findById(context.projectId).populate('team');
        if (project) {
          if (project.team) {
            context.teamId = project.team._id;
          }
          if (project.organization) {
            context.organizationId = project.organization;
          }
        }
      }

      // Check permissions through roles
      const hasDirectPermission = await checkUserPermission(user, requiredResource, requiredAction, context);
      
      if (hasDirectPermission) {
        return next();
      }

      // Check ownership permissions
      if (allowOwner) {
        const isOwner = await checkOwnership(user, context);
        if (isOwner) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

// Check user permission through role-based system
const checkUserPermission = async (user, resource, action, context) => {
  try {
    // Check global permissions
    const globalPermission = user.permissions.global.find(p => p.resource === resource);
    if (globalPermission && globalPermission.actions.includes(action)) {
      return true;
    }

    // Check organization-level permissions
    if (context.organizationId) {
      const orgMembership = user.organizations.find(org => 
        org.organization.toString() === context.organizationId.toString() && 
        org.status === 'active'
      );
      
      if (orgMembership) {
        const role = await Role.findById(orgMembership.role);
        if (role && role.hasPermission(resource, action)) {
          return true;
        }
        
        // Check organization-specific user permissions
        const orgPermission = user.permissions.organizations.find(p => 
          p.organization.toString() === context.organizationId.toString()
        );
        if (orgPermission) {
          const permission = orgPermission.permissions.find(p => p.resource === resource);
          if (permission && permission.actions.includes(action)) {
            return true;
          }
        }
      }
    }

    // Check team-level permissions
    if (context.teamId) {
      const teamMembership = user.teams.find(team => 
        team.team.toString() === context.teamId.toString() && 
        team.status === 'active'
      );
      
      if (teamMembership) {
        const role = await Role.findById(teamMembership.role);
        if (role && role.hasPermission(resource, action)) {
          return true;
        }
        
        // Check team-specific user permissions
        const teamPermission = user.permissions.teams.find(p => 
          p.team.toString() === context.teamId.toString()
        );
        if (teamPermission) {
          const permission = teamPermission.permissions.find(p => p.resource === resource);
          if (permission && permission.actions.includes(action)) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

// Check ownership of resources
const checkOwnership = async (user, context) => {
  try {
    // Check organization ownership
    if (context.organizationId) {
      const organization = await Organization.findById(context.organizationId);
      if (organization && organization.owner.toString() === user._id.toString()) {
        return true;
      }
    }

    // Check team leadership
    if (context.teamId) {
      const team = await Team.findById(context.teamId);
      if (team && team.lead.toString() === user._id.toString()) {
        return true;
      }
    }

    // Check project ownership
    if (context.projectId) {
      const Project = require('../models/Project');
      const project = await Project.findById(context.projectId);
      if (project && project.owner.toString() === user._id.toString()) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking ownership:', error);
    return false;
  }
};

// Middleware to require specific role level
const requireRoleLevel = (minLevel) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const context = extractContext(req);

      // Super admin bypasses role level checks
      if (user.role === 'admin') {
        return next();
      }

      let userRole = null;

      // Get role from context
      if (context.organizationId) {
        const roleId = user.getRoleInOrganization(context.organizationId);
        if (roleId) {
          userRole = await Role.findById(roleId);
        }
      } else if (context.teamId) {
        const roleId = user.getRoleInTeam(context.teamId);
        if (roleId) {
          userRole = await Role.findById(roleId);
        }
      }

      if (!userRole || userRole.level < minLevel) {
        return res.status(403).json({
          success: false,
          message: `Role level ${minLevel} or higher required`
        });
      }

      next();
    } catch (error) {
      console.error('Role level check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role level check failed'
      });
    }
  };
};

// Middleware to check organization membership
const requireOrganizationMembership = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const organizationId = req.params.organizationId || req.body.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID required'
        });
      }

      if (user.role === 'admin' || user.isMemberOfOrganization(organizationId)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Organization membership required'
      });
    } catch (error) {
      console.error('Organization membership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Organization membership check failed'
      });
    }
  };
};

// Middleware to check team membership
const requireTeamMembership = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const teamId = req.params.teamId || req.body.teamId;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID required'
        });
      }

      if (user.role === 'admin' || user.isMemberOfTeam(teamId)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Team membership required'
      });
    } catch (error) {
      console.error('Team membership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Team membership check failed'
      });
    }
  };
};

// Middleware to load user permissions into request
const loadUserPermissions = async (req, res, next) => {
  try {
    if (req.user) {
      // Populate user roles and permissions
      await req.user.populate([
        {
          path: 'organizations.organization',
          select: 'name domain'
        },
        {
          path: 'organizations.role',
          select: 'name permissions level'
        },
        {
          path: 'teams.team',
          select: 'name organization'
        },
        {
          path: 'teams.role',
          select: 'name permissions level'
        }
      ]);
    }
    next();
  } catch (error) {
    console.error('Error loading user permissions:', error);
    next();
  }
};

// Helper function to check multiple permissions
const checkMultiplePermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const context = extractContext(req);

      // Super admin has all permissions
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = await Promise.all(
        permissions.map(({ resource, action }) => 
          checkUserPermission(user, resource, action, context)
        )
      );

      if (hasAnyPermission.some(Boolean)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    } catch (error) {
      console.error('Multiple permissions check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

module.exports = {
  PERMISSIONS,
  hasPermission,
  requireRoleLevel,
  requireOrganizationMembership,
  requireTeamMembership,
  loadUserPermissions,
  checkMultiplePermissions,
  extractContext,
  checkUserPermission,
  checkOwnership
};