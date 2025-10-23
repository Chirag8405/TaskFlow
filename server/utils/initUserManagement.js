const mongoose = require('mongoose');
const { Role, Organization } = require('../models/UserManagement');
const User = require('../models/User');

const seedRoles = async () => {
  try {
    console.log('🌱 Seeding default roles...');

    // Check if roles already exist
    const existingRoles = await Role.countDocuments({ isSystemRole: true });
    if (existingRoles > 0) {
      console.log('✅ System roles already exist, skipping seed');
      return;
    }

    // Define default system roles
    const defaultRoles = [
      {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: [
          {
            resource: 'projects',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'export']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'export']
          },
          {
            resource: 'users',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'invite']
          },
          {
            resource: 'teams',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'invite']
          },
          {
            resource: 'settings',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          },
          {
            resource: 'analytics',
            actions: ['read', 'export']
          },
          {
            resource: 'notifications',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          }
        ],
        level: 10,
        isSystemRole: true,
        color: '#DC2626'
      },
      {
        name: 'Admin',
        description: 'Administrative access to manage organization',
        permissions: [
          {
            resource: 'projects',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          },
          {
            resource: 'users',
            actions: ['read', 'update', 'invite', 'manage']
          },
          {
            resource: 'teams',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'invite']
          },
          {
            resource: 'settings',
            actions: ['read', 'update']
          },
          {
            resource: 'analytics',
            actions: ['read', 'export']
          },
          {
            resource: 'notifications',
            actions: ['create', 'read', 'update', 'delete']
          }
        ],
        level: 9,
        isSystemRole: true,
        color: '#DC2626'
      },
      {
        name: 'Manager',
        description: 'Team management and project oversight',
        permissions: [
          {
            resource: 'projects',
            actions: ['create', 'read', 'update', 'manage']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          },
          {
            resource: 'users',
            actions: ['read', 'invite']
          },
          {
            resource: 'teams',
            actions: ['read', 'update', 'invite']
          },
          {
            resource: 'settings',
            actions: ['read']
          },
          {
            resource: 'analytics',
            actions: ['read']
          },
          {
            resource: 'notifications',
            actions: ['create', 'read', 'update']
          }
        ],
        level: 7,
        isSystemRole: true,
        color: '#F59E0B'
      },
      {
        name: 'Team Lead',
        description: 'Lead team projects and coordinate tasks',
        permissions: [
          {
            resource: 'projects',
            actions: ['create', 'read', 'update']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            resource: 'users',
            actions: ['read']
          },
          {
            resource: 'teams',
            actions: ['read']
          },
          {
            resource: 'settings',
            actions: ['read']
          },
          {
            resource: 'analytics',
            actions: ['read']
          },
          {
            resource: 'notifications',
            actions: ['create', 'read', 'update']
          }
        ],
        level: 6,
        isSystemRole: true,
        color: '#8B5CF6'
      },
      {
        name: 'Senior Member',
        description: 'Experienced team member with additional privileges',
        permissions: [
          {
            resource: 'projects',
            actions: ['read', 'update']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update', 'delete']
          },
          {
            resource: 'users',
            actions: ['read']
          },
          {
            resource: 'teams',
            actions: ['read']
          },
          {
            resource: 'settings',
            actions: ['read']
          },
          {
            resource: 'analytics',
            actions: ['read']
          },
          {
            resource: 'notifications',
            actions: ['create', 'read', 'update']
          }
        ],
        level: 5,
        isSystemRole: true,
        color: '#10B981'
      },
      {
        name: 'Member',
        description: 'Standard team member with basic access',
        permissions: [
          {
            resource: 'projects',
            actions: ['read']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update']
          },
          {
            resource: 'users',
            actions: ['read']
          },
          {
            resource: 'teams',
            actions: ['read']
          },
          {
            resource: 'settings',
            actions: ['read']
          },
          {
            resource: 'analytics',
            actions: ['read']
          },
          {
            resource: 'notifications',
            actions: ['read', 'update']
          }
        ],
        level: 3,
        isSystemRole: true,
        color: '#6B7280'
      },
      {
        name: 'Viewer',
        description: 'Read-only access to projects and tasks',
        permissions: [
          {
            resource: 'projects',
            actions: ['read']
          },
          {
            resource: 'tasks',
            actions: ['read']
          },
          {
            resource: 'users',
            actions: ['read']
          },
          {
            resource: 'teams',
            actions: ['read']
          },
          {
            resource: 'analytics',
            actions: ['read']
          },
          {
            resource: 'notifications',
            actions: ['read']
          }
        ],
        level: 1,
        isSystemRole: true,
        color: '#9CA3AF'
      }
    ];

    // Create roles
    const createdRoles = await Role.insertMany(defaultRoles);
    console.log(`✅ Created ${createdRoles.length} default roles`);

    // Create indexes
    await Role.createIndexes();
    console.log('✅ Created role indexes');

    return createdRoles;
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};

const migrateExistingUsers = async () => {
  try {
    console.log('🔄 Migrating existing users to new role system...');

    // Get default roles
    const adminRole = await Role.findOne({ name: 'Admin', isSystemRole: true });
    const memberRole = await Role.findOne({ name: 'Member', isSystemRole: true });

    if (!adminRole || !memberRole) {
      console.log('❌ Default roles not found, skipping migration');
      return;
    }

    // Get all users without organizations array (old schema)
    const usersToMigrate = await User.find({
      $or: [
        { organizations: { $exists: false } },
        { organizations: { $size: 0 } },
        { teams: { $exists: false } },
        { teams: { $size: 0 } },
        { permissions: { $exists: false } }
      ]
    });

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration');
      return;
    }

    console.log(`📊 Found ${usersToMigrate.length} users to migrate`);

    for (const user of usersToMigrate) {
      // Initialize new fields if they don't exist
      if (!user.organizations) user.organizations = [];
      if (!user.teams) user.teams = [];
      if (!user.permissions) {
        user.permissions = {
          global: [],
          organizations: [],
          teams: []
        };
      }
      if (!user.profile) {
        user.profile = {
          firstName: user.name.split(' ')[0] || '',
          lastName: user.name.split(' ').slice(1).join(' ') || ''
        };
      }
      if (!user.security) {
        user.security = {
          twoFactorEnabled: false,
          lastPasswordChange: new Date(),
          passwordHistory: [],
          loginAttempts: {
            count: 0
          },
          sessions: []
        };
      }
      if (!user.activity) {
        user.activity = {
          totalLogins: 0,
          totalTimeSpent: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          projectsCreated: 0,
          commentsPosted: 0
        };
      }

      // Set global permissions based on old role
      if (user.role === 'admin') {
        user.permissions.global = [
          {
            resource: 'users',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'invite']
          },
          {
            resource: 'projects',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          },
          {
            resource: 'tasks',
            actions: ['create', 'read', 'update', 'delete', 'manage']
          },
          {
            resource: 'teams',
            actions: ['create', 'read', 'update', 'delete', 'manage', 'invite']
          },
          {
            resource: 'settings',
            actions: ['read', 'update', 'manage']
          },
          {
            resource: 'analytics',
            actions: ['read', 'export']
          }
        ];
      }

      await user.save();
    }

    console.log(`✅ Migrated ${usersToMigrate.length} users`);
  } catch (error) {
    console.error('❌ Error migrating users:', error);
    throw error;
  }
};

const createDefaultOrganization = async () => {
  try {
    console.log('🏢 Creating default organization...');

    // Check if any organizations exist
    const existingOrgs = await Organization.countDocuments();
    if (existingOrgs > 0) {
      console.log('✅ Organizations already exist, skipping creation');
      return;
    }

    // Get admin users
    const adminUsers = await User.find({ role: 'admin' }).limit(1);
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found, skipping default organization creation');
      return;
    }

    const adminUser = adminUsers[0];
    const defaultRole = await Role.findOne({ name: 'Member', isSystemRole: true });

    if (!defaultRole) {
      console.log('❌ Default role not found');
      return;
    }

    // Create default organization
    const organization = await Organization.create({
      name: 'Default Organization',
      description: 'Default organization for all users',
      owner: adminUser._id,
      settings: {
        allowDomainSignup: false,
        requireInvitation: false,
        defaultRole: defaultRole._id,
        features: {
          maxProjects: 100,
          maxMembers: 100,
          storageLimit: 5368709120 // 5GB
        }
      },
      members: [{
        user: adminUser._id,
        role: defaultRole._id,
        status: 'active'
      }]
    });

    // Add organization to admin user
    await adminUser.addToOrganization(organization._id, defaultRole._id);

    console.log('✅ Created default organization');
    return organization;
  } catch (error) {
    console.error('❌ Error creating default organization:', error);
    throw error;
  }
};

const initializeUserManagement = async () => {
  try {
    console.log('🚀 Initializing user management system...');

    // Seed default roles
    await seedRoles();

    // Migrate existing users
    await migrateExistingUsers();

    // Create default organization
    await createDefaultOrganization();

    console.log('✅ User management system initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing user management system:', error);
    throw error;
  }
};

// Export individual functions for testing
module.exports = {
  seedRoles,
  migrateExistingUsers,
  createDefaultOrganization,
  initializeUserManagement
};

// Run initialization if this file is executed directly
if (require.main === module) {
  const connectDB = require('../config/db');
  
  const runInitialization = async () => {
    try {
      await connectDB();
      await initializeUserManagement();
      process.exit(0);
    } catch (error) {
      console.error('Initialization failed:', error);
      process.exit(1);
    }
  };

  runInitialization();
}