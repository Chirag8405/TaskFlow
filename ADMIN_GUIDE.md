# Admin User Management Guide

This guide explains how to create and manage admin users in the Real-Time Task Manager application.

## Understanding User Roles

The application has two user roles:
- **Member** (default): Regular users with standard permissions
- **Admin**: Superusers with elevated permissions across the platform

### Admin Privileges

Admins have the following additional permissions:
- Delete any project (not just owned projects)
- Remove any user from any project  
- Delete any task (not just created tasks)
- Access all projects and tasks
- Manage user roles and permissions

## Method 1: Promote Existing User to Admin

### Using npm Script (Easiest)

```bash
cd server
npm run admin:promote user@example.com
```

### Using Direct Script

```bash
cd server
node scripts/promoteToAdmin.js user@example.com
```

### Example

```bash
$ npm run admin:promote chirag@example.com

✅ Connected to MongoDB
✅ Success!
👤 User: Chirag
📧 Email: chirag@example.com
🎖️  Role: admin

The user has been promoted to admin.
```

## Method 2: List All Users

To see all users and their current roles:

```bash
cd server
npm run admin:list
```

### Example Output

```
✅ Connected to MongoDB

📋 Total Users: 3

────────────────────────────────────────────────────────────────────────────────
Name                     Email                         Role           Created
────────────────────────────────────────────────────────────────────────────────
Chirag                   chirag@example.com            👑 admin       10/23/2025
John Doe                 john@example.com              👤 member      10/22/2025
Jane Smith               jane@example.com              👤 member      10/21/2025
────────────────────────────────────────────────────────────────────────────────

👑 Admins: 1
👤 Members: 2
```

## Method 3: Create Admin During Registration (Future Feature)

Currently, all new registrations create member accounts by default. To create an admin:

1. Register normally through the UI
2. Use the promote script to upgrade to admin

### Planned Features

- **First User Auto-Admin**: The first user to register will automatically become an admin
- **Admin Invitation System**: Admins can invite other users and assign roles during invitation
- **Settings Panel**: UI for admins to promote/demote users

## Method 4: MongoDB Direct Update (Advanced)

If you have direct database access:

```javascript
// Connect to MongoDB
use realtime_task_manager

// Promote user to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Verify the update
db.users.findOne({ email: "user@example.com" }, { name: 1, email: 1, role: 1 })
```

## Common Scenarios

### Scenario 1: Make Yourself Admin

If you're the project owner and want admin access:

```bash
# 1. Find your email from your account
# 2. Promote your account
cd server
npm run admin:promote your-email@example.com
```

### Scenario 2: Transfer Admin Rights

```bash
# Promote new admin
npm run admin:promote newadmin@example.com

# Optionally demote old admin (requires MongoDB access)
```

### Scenario 3: Check Who Has Admin Access

```bash
npm run admin:list
# Look for 👑 crown icon next to admin users
```

## Troubleshooting

### Error: "User not found"

```bash
# First, list all users to see available emails
npm run admin:list

# Then use the exact email from the list
npm run admin:promote correct-email@example.com
```

### Error: "MongoDB Connection Failed"

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check .env file has correct MONGO_URI
cat .env | grep MONGO_URI

# Test connection
mongosh "mongodb://localhost:27017/realtime_task_manager"
```

### Error: "User is already an admin"

This is just an informational message. The user already has admin privileges.

## Security Best Practices

1. **Limit Admin Accounts**: Only promote trusted users to admin
2. **Regular Audits**: Periodically run `npm run admin:list` to review admin users
3. **Document Changes**: Keep a record of when and why users were promoted
4. **Secure Access**: Never share admin credentials
5. **Environment Protection**: In production, restrict who can run these scripts

## Script Details

### promoteToAdmin.js

- **Purpose**: Upgrade a member to admin
- **Input**: User email address
- **Output**: Confirmation message with user details
- **Side Effects**: Updates user document in MongoDB

### listUsers.js

- **Purpose**: Display all users with their roles
- **Input**: None
- **Output**: Formatted table of users
- **Side Effects**: None (read-only)

## Future Enhancements

Planned improvements for admin management:

- [ ] Web UI for user management
- [ ] Role hierarchy (super-admin, admin, moderator, member)
- [ ] Audit log for role changes
- [ ] Batch promotion/demotion
- [ ] API endpoints for role management
- [ ] Email notifications when promoted/demoted
- [ ] Custom role creation
- [ ] Permission granularity controls

## API Endpoints (For Developers)

Currently, there are no public API endpoints for role management. This is by design for security. All role changes must be done through:
- Server-side scripts (documented above)
- Direct database access (for emergencies)

Future versions may include protected API endpoints accessible only by existing admins.

---

## Quick Reference

| Task | Command |
|------|---------|
| Promote user to admin | `npm run admin:promote <email>` |
| List all users | `npm run admin:list` |
| Check MongoDB connection | `mongosh $MONGO_URI` |
| Find script location | `server/scripts/` |

For additional help, check the project documentation or open an issue on GitHub.
