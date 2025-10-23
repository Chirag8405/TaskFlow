const mongoose = require('mongoose');

// Role schema
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  permissions: [{
    resource: {
      type: String,
      required: true,
      enum: ['projects', 'tasks', 'users', 'teams', 'settings', 'analytics', 'notifications']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage', 'invite', 'export']
    }]
  }],
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 5
  },
  isSystemRole: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Team schema
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    }
  }],
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    defaultRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }
  },
  avatar: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Organization schema
const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'active'
    }
  }],
  settings: {
    allowDomainSignup: {
      type: Boolean,
      default: false
    },
    requireInvitation: {
      type: Boolean,
      default: true
    },
    defaultRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    features: {
      maxProjects: {
        type: Number,
        default: 10
      },
      maxMembers: {
        type: Number,
        default: 50
      },
      storageLimit: {
        type: Number,
        default: 1073741824 // 1GB in bytes
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing'],
      default: 'active'
    },
    currentPeriodEnd: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  logo: {
    type: String
  },
  website: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  }
}, {
  timestamps: true
});

// Invitation schema
const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  message: {
    type: String,
    maxlength: 500
  },
  acceptedAt: Date,
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ level: 1 });

teamSchema.index({ name: 1, organization: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ organization: 1 });

organizationSchema.index({ owner: 1 });
organizationSchema.index({ 'members.user': 1 });

invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual methods
teamSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

organizationSchema.virtual('activeMembers').get(function() {
  return this.members.filter(member => member.status === 'active');
});

organizationSchema.virtual('activeMemberCount').get(function() {
  return this.activeMembers.length;
});

// Instance methods
roleSchema.methods.hasPermission = function(resource, action) {
  const permission = this.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

teamSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
  return member ? member.role : null;
};

teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
};

organizationSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
  return member ? member.role : null;
};

organizationSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString() && member.status === 'active'
  );
};

organizationSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

// Static methods
roleSchema.statics.getSystemRoles = function() {
  return this.find({ isSystemRole: true });
};

teamSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.user': userId, 'members.status': 'active' });
};

organizationSchema.statics.findByMember = function(userId) {
  return this.find({ 'members.user': userId, 'members.status': 'active' });
};

invitationSchema.statics.findPending = function(email) {
  return this.find({ 
    email, 
    status: 'pending', 
    expiresAt: { $gt: new Date() } 
  });
};

// Middleware
teamSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add creator as team lead if not already a member
    const isCreatorMember = this.members.some(member => 
      member.user.toString() === this.createdBy.toString()
    );
    
    if (!isCreatorMember) {
      this.members.push({
        user: this.createdBy,
        role: this.settings.defaultRole,
        status: 'active'
      });
    }
  }
  next();
});

organizationSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add owner as organization member if not already a member
    const isOwnerMember = this.members.some(member => 
      member.user.toString() === this.owner.toString()
    );
    
    if (!isOwnerMember) {
      this.members.push({
        user: this.owner,
        role: this.settings.defaultRole,
        status: 'active'
      });
    }
  }
  next();
});

// Compile models
const Role = mongoose.model('Role', roleSchema);
const Team = mongoose.model('Team', teamSchema);
const Organization = mongoose.model('Organization', organizationSchema);
const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = {
  Role,
  Team,
  Organization,
  Invitation
};