const { Role, Organization, Team, Invitation } = require('../models/UserManagement');
const User = require('../models/User');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// Get all roles
const getRoles = async (req, res) => {
  try {
    const { organizationId, includeSystem = true } = req.query;
    
    let query = {};
    if (!includeSystem) {
      query.isSystemRole = false;
    }
    
    const roles = await Role.find(query).sort({ level: -1, name: 1 });
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles'
    });
  }
};

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions, level, color } = req.body;
    
    const role = await Role.create({
      name,
      description,
      permissions,
      level,
      color,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Error creating role:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create role'
    });
  }
};

// Update a role
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const updates = req.body;
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Prevent modification of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify system roles'
      });
    }
    
    Object.assign(role, updates);
    await role.save();
    
    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role'
    });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }
    
    // Check if role is being used
    const organizationsUsingRole = await Organization.countDocuments({
      $or: [
        { 'members.role': roleId },
        { 'settings.defaultRole': roleId }
      ]
    });
    
    const teamsUsingRole = await Team.countDocuments({
      $or: [
        { 'members.role': roleId },
        { 'settings.defaultRole': roleId }
      ]
    });
    
    if (organizationsUsingRole > 0 || teamsUsingRole > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is currently in use'
      });
    }
    
    await Role.findByIdAndDelete(roleId);
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role'
    });
  }
};

// Get all organizations for user
const getOrganizations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    const organizations = await Organization.find({
      'members.user': userId,
      'members.status': 'active'
    })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate('members.role', 'name level color')
    .sort({ name: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await Organization.countDocuments({
      'members.user': userId,
      'members.status': 'active'
    });
    
    res.json({
      success: true,
      data: organizations,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
};

// Create organization
const createOrganization = async (req, res) => {
  try {
    const { name, description, domain, settings } = req.body;
    
    // Get or create default role
    let defaultRole = await Role.findOne({ name: 'Member', isSystemRole: true });
    if (!defaultRole) {
      defaultRole = await Role.create({
        name: 'Member',
        description: 'Default member role',
        permissions: [
          {
            resource: 'projects',
            actions: ['read']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update']
          }
        ],
        level: 3,
        isSystemRole: true
      });
    }
    
    const organization = await Organization.create({
      name,
      description,
      domain,
      owner: req.user._id,
      settings: {
        ...settings,
        defaultRole: defaultRole._id
      },
      members: [{
        user: req.user._id,
        role: defaultRole._id,
        status: 'active'
      }]
    });
    
    // Add organization to user
    await req.user.addToOrganization(organization._id, defaultRole._id);
    
    await organization.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
      { path: 'members.role', select: 'name level color' }
    ]);
    
    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Domain already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create organization'
    });
  }
};

// Get organization details
const getOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await Organization.findById(organizationId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar profile.title profile.department')
      .populate('members.role', 'name level color permissions');
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const updates = req.body;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    Object.assign(organization, updates);
    await organization.save();
    
    await organization.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
      { path: 'members.role', select: 'name level color' }
    ]);
    
    res.json({
      success: true,
      data: organization,
      message: 'Organization updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization'
    });
  }
};

// Invite user to organization
const inviteToOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { email, roleId, message } = req.body;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
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
    if (existingUser && organization.isMember(existingUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this organization'
      });
    }
    
    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      organization: organizationId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already sent to this email'
      });
    }
    
    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      organization: organizationId,
      role: roleId,
      invitedBy: req.user._id,
      token,
      message
    });
    
    // Send invitation email
    await emailService.sendOrganizationInvitation({
      to: email,
      organizationName: organization.name,
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
    console.error('Error inviting to organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
};

// Accept organization invitation
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('organization').populate('role');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }
    
    const user = req.user;
    
    // Check if user email matches invitation email
    if (user.email !== invitation.email) {
      return res.status(403).json({
        success: false,
        message: 'Email mismatch'
      });
    }
    
    // Add user to organization
    const organization = invitation.organization;
    organization.members.push({
      user: user._id,
      role: invitation.role._id,
      invitedBy: invitation.invitedBy,
      status: 'active'
    });
    await organization.save();
    
    // Add organization to user
    await user.addToOrganization(organization._id, invitation.role._id);
    
    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();
    
    res.json({
      success: true,
      data: organization,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation'
    });
  }
};

// Get user's teams
const getTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const { organizationId } = req.query;
    
    let query = {
      'members.user': userId,
      'members.status': 'active'
    };
    
    if (organizationId) {
      query.organization = organizationId;
    }
    
    const teams = await Team.find(query)
      .populate('organization', 'name')
      .populate('lead', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('members.role', 'name level color')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams'
    });
  }
};

// Create team
const createTeam = async (req, res) => {
  try {
    const { name, description, organizationId, settings } = req.body;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    // Get default role
    const defaultRole = await Role.findById(organization.settings.defaultRole);
    
    const team = await Team.create({
      name,
      description,
      organization: organizationId,
      lead: req.user._id,
      createdBy: req.user._id,
      settings: {
        ...settings,
        defaultRole: defaultRole._id
      },
      members: [{
        user: req.user._id,
        role: defaultRole._id,
        status: 'active'
      }]
    });
    
    // Add team to user
    await req.user.addToTeam(team._id, defaultRole._id);
    
    await team.populate([
      { path: 'organization', select: 'name' },
      { path: 'lead', select: 'name email avatar' },
      { path: 'members.user', select: 'name email avatar' },
      { path: 'members.role', select: 'name level color' }
    ]);
    
    res.status(201).json({
      success: true,
      data: team,
      message: 'Team created successfully'
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team'
    });
  }
};

// Get pending invitations
const getPendingInvitations = async (req, res) => {
  try {
    const email = req.user.email;
    
    const invitations = await Invitation.find({
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })
    .populate('organization', 'name description logo')
    .populate('team', 'name description')
    .populate('project', 'name description')
    .populate('role', 'name description level color')
    .populate('invitedBy', 'name email avatar')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending invitations'
    });
  }
};

module.exports = {
  // Roles
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  
  // Organizations
  getOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  inviteToOrganization,
  
  // Teams
  getTeams,
  createTeam,
  
  // Invitations
  acceptInvitation,
  getPendingInvitations
};