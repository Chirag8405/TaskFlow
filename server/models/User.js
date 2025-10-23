const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Role, Organization, Team } = require('./UserManagement');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  // Enhanced role-based access control
  organizations: [{
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  teams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  permissions: {
    // Global permissions (system-wide)
    global: [{
      resource: String,
      actions: [String]
    }],
    // Organization-specific permissions
    organizations: [{
      organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
      },
      permissions: [{
        resource: String,
        actions: [String]
      }]
    }],
    // Team-specific permissions
    teams: [{
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      permissions: [{
        resource: String,
        actions: [String]
      }]
    }]
  },
  profile: {
    firstName: String,
    lastName: String,
    title: String,
    department: String,
    phoneNumber: String,
    location: String,
    website: String,
    linkedIn: String,
    github: String,
    skills: [String],
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    backupCodes: [String],
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    passwordHistory: [{
      hash: String,
      createdAt: Date
    }],
    loginAttempts: {
      count: {
        type: Number,
        default: 0
      },
      lastAttempt: Date,
      lockedUntil: Date
    },
    sessions: [{
      sessionId: String,
      ipAddress: String,
      userAgent: String,
      location: String,
      createdAt: Date,
      lastActivity: Date,
      isActive: Boolean
    }]
  },
  activity: {
    totalLogins: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lastActivity: Date,
    tasksCreated: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    projectsCreated: {
      type: Number,
      default: 0
    },
    commentsPosted: {
      type: Number,
      default: 0
    }
  },
  avatar: {
    type: String,
    default: function() {
      // Generate initials as default avatar
      const nameWords = this.name.split(' ');
      if (nameWords.length >= 2) {
        return nameWords[0][0].toUpperCase() + nameWords[1][0].toUpperCase();
      }
      return this.name[0].toUpperCase();
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      emailTypes: {
        task_assigned: { type: Boolean, default: true },
        task_updated: { type: Boolean, default: true },
        task_completed: { type: Boolean, default: true },
        task_commented: { type: Boolean, default: true },
        project_invitation: { type: Boolean, default: true },
        project_updated: { type: Boolean, default: false },
        mention: { type: Boolean, default: true },
        deadline_reminder: { type: Boolean, default: true },
        team_member_joined: { type: Boolean, default: false },
        system_announcement: { type: Boolean, default: true }
      },
      pushTypes: {
        task_assigned: { type: Boolean, default: true },
        task_updated: { type: Boolean, default: false },
        task_completed: { type: Boolean, default: false },
        task_commented: { type: Boolean, default: true },
        project_invitation: { type: Boolean, default: true },
        project_updated: { type: Boolean, default: false },
        mention: { type: Boolean, default: true },
        deadline_reminder: { type: Boolean, default: true },
        team_member_joined: { type: Boolean, default: false },
        system_announcement: { type: Boolean, default: false }
      },
      digestFrequency: {
        type: String,
        enum: ['never', 'daily', 'weekly'],
        default: 'daily'
      },
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '08:00' }
      }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Enhanced permission checking methods
userSchema.methods.hasPermission = function(resource, action, context = {}) {
  const { organizationId, teamId } = context;
  
  // Check global permissions first
  const globalPermission = this.permissions.global.find(p => p.resource === resource);
  if (globalPermission && globalPermission.actions.includes(action)) {
    return true;
  }
  
  // Check organization-specific permissions
  if (organizationId) {
    const orgPermission = this.permissions.organizations.find(p => 
      p.organization.toString() === organizationId.toString()
    );
    if (orgPermission) {
      const permission = orgPermission.permissions.find(p => p.resource === resource);
      if (permission && permission.actions.includes(action)) {
        return true;
      }
    }
  }
  
  // Check team-specific permissions
  if (teamId) {
    const teamPermission = this.permissions.teams.find(p => 
      p.team.toString() === teamId.toString()
    );
    if (teamPermission) {
      const permission = teamPermission.permissions.find(p => p.resource === resource);
      if (permission && permission.actions.includes(action)) {
        return true;
      }
    }
  }
  
  return false;
};

userSchema.methods.getRoleInOrganization = function(organizationId) {
  const membership = this.organizations.find(org => 
    org.organization.toString() === organizationId.toString() && org.status === 'active'
  );
  return membership ? membership.role : null;
};

userSchema.methods.getRoleInTeam = function(teamId) {
  const membership = this.teams.find(team => 
    team.team.toString() === teamId.toString() && team.status === 'active'
  );
  return membership ? membership.role : null;
};

userSchema.methods.isAdminInOrganization = async function(organizationId) {
  const roleId = this.getRoleInOrganization(organizationId);
  if (!roleId) return false;
  
  const role = await Role.findById(roleId);
  return role && role.level >= 8; // Admin level
};

userSchema.methods.isMemberOfOrganization = function(organizationId) {
  return this.organizations.some(org => 
    org.organization.toString() === organizationId.toString() && org.status === 'active'
  );
};

userSchema.methods.isMemberOfTeam = function(teamId) {
  return this.teams.some(team => 
    team.team.toString() === teamId.toString() && team.status === 'active'
  );
};

userSchema.methods.getActiveOrganizations = function() {
  return this.organizations.filter(org => org.status === 'active');
};

userSchema.methods.getActiveTeams = function() {
  return this.teams.filter(team => team.status === 'active');
};

userSchema.methods.addToOrganization = function(organizationId, roleId) {
  // Remove existing membership if any
  this.organizations = this.organizations.filter(org => 
    org.organization.toString() !== organizationId.toString()
  );
  
  // Add new membership
  this.organizations.push({
    organization: organizationId,
    role: roleId,
    status: 'active',
    joinedAt: new Date()
  });
  
  return this.save();
};

userSchema.methods.addToTeam = function(teamId, roleId) {
  // Remove existing membership if any
  this.teams = this.teams.filter(team => 
    team.team.toString() !== teamId.toString()
  );
  
  // Add new membership
  this.teams.push({
    team: teamId,
    role: roleId,
    status: 'active',
    joinedAt: new Date()
  });
  
  return this.save();
};

userSchema.methods.removeFromOrganization = function(organizationId) {
  this.organizations = this.organizations.filter(org => 
    org.organization.toString() !== organizationId.toString()
  );
  return this.save();
};

userSchema.methods.removeFromTeam = function(teamId) {
  this.teams = this.teams.filter(team => 
    team.team.toString() !== teamId.toString()
  );
  return this.save();
};

userSchema.methods.updateActivity = function(activityType, increment = 1) {
  if (this.activity[activityType] !== undefined) {
    this.activity[activityType] += increment;
  }
  this.activity.lastActivity = new Date();
  return this.save();
};

userSchema.methods.addSession = function(sessionData) {
  this.security.sessions.push({
    sessionId: sessionData.sessionId,
    ipAddress: sessionData.ipAddress,
    userAgent: sessionData.userAgent,
    location: sessionData.location,
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true
  });
  
  // Keep only last 10 sessions
  if (this.security.sessions.length > 10) {
    this.security.sessions = this.security.sessions.slice(-10);
  }
  
  return this.save();
};

userSchema.methods.deactivateSession = function(sessionId) {
  const session = this.security.sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.isActive = false;
  }
  return this.save();
};

userSchema.methods.recordLoginAttempt = function(success = false) {
  if (success) {
    this.security.loginAttempts.count = 0;
    this.activity.totalLogins += 1;
  } else {
    this.security.loginAttempts.count += 1;
    this.security.loginAttempts.lastAttempt = new Date();
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.security.loginAttempts.count >= 5) {
      this.security.loginAttempts.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }
  return this.save();
};

userSchema.methods.isAccountLocked = function() {
  return this.security.loginAttempts.lockedUntil && 
         this.security.loginAttempts.lockedUntil > new Date();
};

userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.security.twoFactorSecret;
  delete userObject.security.backupCodes;
  delete userObject.security.passwordHistory;
  return userObject;
};

userSchema.methods.getBasicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    profile: {
      title: this.profile?.title,
      department: this.profile?.department
    }
  };
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Update lastSeen when user comes online
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.isOnline = true;
  return this.save();
};

// Set user offline
userSchema.methods.setOffline = function() {
  this.isOnline = false;
  this.lastSeen = new Date();
  return this.save();
};

// Virtual for full name
userSchema.virtual('initials').get(function() {
  if (!this.name) return '?';
  const nameWords = this.name.split(' ');
  if (nameWords.length >= 2) {
    return nameWords[0][0].toUpperCase() + nameWords[1][0].toUpperCase();
  }
  return this.name[0].toUpperCase();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);