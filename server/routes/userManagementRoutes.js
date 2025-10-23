const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  hasPermission,
  requireRoleLevel,
  requireOrganizationMembership,
  requireTeamMembership,
  PERMISSIONS
} = require('../middleware/rbacMiddleware');
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  inviteToOrganization,
  getTeams,
  createTeam,
  acceptInvitation,
  getPendingInvitations
} = require('../controllers/userManagementController');

// Apply auth middleware to all routes
router.use(protect);

// Role Management Routes
router.get('/roles', getRoles);

router.post('/roles', 
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.MANAGE),
  createRole
);

router.put('/roles/:roleId',
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.MANAGE),
  updateRole
);

router.delete('/roles/:roleId',
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.MANAGE),
  deleteRole
);

// Organization Management Routes
router.get('/organizations', getOrganizations);

router.post('/organizations', createOrganization);

router.get('/organizations/:organizationId',
  requireOrganizationMembership(),
  getOrganization
);

router.put('/organizations/:organizationId',
  requireOrganizationMembership(),
  hasPermission(PERMISSIONS.RESOURCES.SETTINGS, PERMISSIONS.ACTIONS.UPDATE, { allowOwner: true }),
  updateOrganization
);

router.post('/organizations/:organizationId/invite',
  requireOrganizationMembership(),
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.INVITE),
  inviteToOrganization
);

// Team Management Routes
router.get('/teams', getTeams);

router.post('/teams',
  hasPermission(PERMISSIONS.RESOURCES.TEAMS, PERMISSIONS.ACTIONS.CREATE),
  createTeam
);

router.get('/teams/:teamId',
  requireTeamMembership(),
  getTeams
);

// Additional routes will be defined after function declarations

// Additional controller functions (to be implemented)
const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const updates = req.body;
    
    const { Team } = require('../models/UserManagement');
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    Object.assign(team, updates);
    await team.save();
    
    await team.populate([
      { path: 'organization', select: 'name' },
      { path: 'lead', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
      { path: 'members.role', select: 'name level color' }
    ]);
    
    res.json({
      success: true,
      data: team,
      message: 'Team updated successfully'
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team'
    });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const { Team } = require('../models/UserManagement');
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if team has active projects
    const Project = require('../models/Project');
    const activeProjects = await Project.countDocuments({ team: teamId });
    
    if (activeProjects > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team with active projects'
      });
    }
    
    // Remove team from all users
    const User = require('../models/User');
    await User.updateMany(
      { 'teams.team': teamId },
      { $pull: { teams: { team: teamId } } }
    );
    
    await Team.findByIdAndDelete(teamId);
    
    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team'
    });
  }
};

const inviteToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, roleId, message } = req.body;
    
    const { Team, Invitation } = require('../models/UserManagement');
    const crypto = require('crypto');
    const emailService = require('../utils/emailService');
    const User = require('../models/User');
    const Role = require('../models/UserManagement').Role;
    
    const team = await Team.findById(teamId).populate('organization');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && team.isMember(existingUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }
    
    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      team: teamId,
      role: roleId,
      invitedBy: req.user._id,
      token,
      message
    });
    
    // Send invitation email
    await emailService.sendTeamInvitation({
      to: email,
      teamName: team.name,
      organizationName: team.organization.name,
      inviterName: req.user.name,
      role: role.name,
      message,
      invitationUrl: `${process.env.CLIENT_URL}/invitations/${token}`
    });
    
    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('Error inviting to team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
};

const updateTeamMemberRole = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { roleId } = req.body;
    
    const { Team } = require('../models/UserManagement');
    const User = require('../models/User');
    
    const team = await Team.findById(teamId);
    const user = await User.findById(userId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update team member role
    const member = team.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this team'
      });
    }
    
    member.role = roleId;
    await team.save();
    
    // Update user's team role
    const userTeam = user.teams.find(t => t.team.toString() === teamId);
    if (userTeam) {
      userTeam.role = roleId;
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role'
    });
  }
};

const removeTeamMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    
    const { Team } = require('../models/UserManagement');
    const User = require('../models/User');
    
    const team = await Team.findById(teamId);
    const user = await User.findById(userId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow removing team lead
    if (team.lead.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team lead'
      });
    }
    
    // Remove from team
    team.members = team.members.filter(m => m.user.toString() !== userId);
    await team.save();
    
    // Remove from user
    await user.removeFromTeam(teamId);
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
};

const getOrganizationMembers = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { page = 1, limit = 20, search, role } = req.query;
    
    const { Organization } = require('../models/UserManagement');
    
    let organization = await Organization.findById(organizationId)
      .populate({
        path: 'members.user',
        select: 'name email avatar profile.title profile.department activity.lastActivity isOnline',
        match: search ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        } : {}
      })
      .populate('members.role', 'name level color permissions');
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    let members = organization.members.filter(member => member.user);
    
    // Filter by role if specified
    if (role) {
      members = members.filter(member => member.role._id.toString() === role);
    }
    
    // Pagination
    const total = members.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    members = members.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: members,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization members'
    });
  }
};

const updateOrganizationMemberRole = async (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    const { roleId } = req.body;
    
    const { Organization } = require('../models/UserManagement');
    const User = require('../models/User');
    
    const organization = await Organization.findById(organizationId);
    const user = await User.findById(userId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow changing owner role
    if (organization.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change organization owner role'
      });
    }
    
    // Update organization member role
    const member = organization.members.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this organization'
      });
    }
    
    member.role = roleId;
    await organization.save();
    
    // Update user's organization role
    const userOrg = user.organizations.find(o => o.organization.toString() === organizationId);
    if (userOrg) {
      userOrg.role = roleId;
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization member role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role'
    });
  }
};

const removeOrganizationMember = async (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    
    const { Organization } = require('../models/UserManagement');
    const User = require('../models/User');
    
    const organization = await Organization.findById(organizationId);
    const user = await User.findById(userId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow removing organization owner
    if (organization.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove organization owner'
      });
    }
    
    // Remove from organization
    organization.members = organization.members.filter(m => m.user.toString() !== userId);
    await organization.save();
    
    // Remove from user
    await user.removeFromOrganization(organizationId);
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing organization member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
};

const declineInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    const { Invitation } = require('../models/UserManagement');
    
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }
    
    invitation.status = 'declined';
    await invitation.save();
    
    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline invitation'
    });
  }
};

const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { organizationId, teamId } = req.query;
    
    const User = require('../models/User');
    const user = await User.findById(userId)
      .populate('organizations.organization', 'name')
      .populate('organizations.role', 'name permissions level')
      .populate('teams.team', 'name organization')
      .populate('teams.role', 'name permissions level');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let permissions = {
      global: user.permissions.global,
      organizations: user.permissions.organizations,
      teams: user.permissions.teams,
      roles: {
        organizations: user.organizations,
        teams: user.teams
      }
    };
    
    // Filter by context if provided
    if (organizationId) {
      permissions.organizations = permissions.organizations.filter(
        p => p.organization.toString() === organizationId
      );
      permissions.roles.organizations = permissions.roles.organizations.filter(
        o => o.organization._id.toString() === organizationId
      );
    }
    
    if (teamId) {
      permissions.teams = permissions.teams.filter(
        p => p.team.toString() === teamId
      );
      permissions.roles.teams = permissions.roles.teams.filter(
        t => t.team._id.toString() === teamId
      );
    }
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user permissions'
    });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user permissions
    if (permissions.global) {
      user.permissions.global = permissions.global;
    }
    
    if (permissions.organizations) {
      permissions.organizations.forEach(orgPerm => {
        const existingIndex = user.permissions.organizations.findIndex(
          p => p.organization.toString() === orgPerm.organization
        );
        
        if (existingIndex >= 0) {
          user.permissions.organizations[existingIndex] = orgPerm;
        } else {
          user.permissions.organizations.push(orgPerm);
        }
      });
    }
    
    if (permissions.teams) {
      permissions.teams.forEach(teamPerm => {
        const existingIndex = user.permissions.teams.findIndex(
          p => p.team.toString() === teamPerm.team
        );
        
        if (existingIndex >= 0) {
          user.permissions.teams[existingIndex] = teamPerm;
        } else {
          user.permissions.teams.push(teamPerm);
        }
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user permissions'
    });
  }
};

// Define routes that use locally declared functions
router.put('/teams/:teamId',
  requireTeamMembership(),
  hasPermission(PERMISSIONS.RESOURCES.TEAMS, PERMISSIONS.ACTIONS.UPDATE, { allowOwner: true }),
  updateTeam
);

router.delete('/teams/:teamId',
  requireTeamMembership(),
  hasPermission(PERMISSIONS.RESOURCES.TEAMS, PERMISSIONS.ACTIONS.DELETE, { allowOwner: true }),
  deleteTeam
);

router.post('/teams/:teamId/invite',
  requireTeamMembership(),
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.INVITE),
  inviteToTeam
);

router.post('/teams/:teamId/members/:userId/role',
  requireTeamMembership(),
  requireRoleLevel(7), // Manager level or higher
  updateTeamMemberRole
);

router.delete('/teams/:teamId/members/:userId',
  requireTeamMembership(),
  requireRoleLevel(7), // Manager level or higher
  removeTeamMember
);

// Organization Member Management Routes
router.get('/organizations/:organizationId/members',
  requireOrganizationMembership(),
  getOrganizationMembers
);

router.post('/organizations/:organizationId/members/:userId/role',
  requireOrganizationMembership(),
  requireRoleLevel(8), // Admin level or higher
  updateOrganizationMemberRole
);

router.delete('/organizations/:organizationId/members/:userId',
  requireOrganizationMembership(),
  requireRoleLevel(8), // Admin level or higher
  removeOrganizationMember
);

// Invitation Routes
router.get('/invitations/pending', getPendingInvitations);

router.post('/invitations/:token/accept', acceptInvitation);

router.post('/invitations/:token/decline', declineInvitation);

// User Permission Routes
router.get('/users/:userId/permissions',
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.READ),
  getUserPermissions
);

router.post('/users/:userId/permissions',
  hasPermission(PERMISSIONS.RESOURCES.USERS, PERMISSIONS.ACTIONS.MANAGE),
  updateUserPermissions
);

module.exports = router;