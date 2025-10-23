# Project Documentation - Real-Time Task Manager

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Reference](#api-reference)
4. [WebSocket Events](#websocket-events)
5. [Component Structure](#component-structure)
6. [State Management](#state-management)
7. [Authentication Flow](#authentication-flow)
8. [Deployment Guide](#deployment-guide)

## Architecture Overview

### System Architecture
```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  React Client   │◄────►│  Express Server  │◄────►│   MongoDB       │
│  (Port 5173)    │      │  (Port 5000)     │      │   (Port 27017)  │
│                 │      │                  │      │                 │
└────────┬────────┘      └────────┬─────────┘      └─────────────────┘
         │                        │
         │    WebSocket (Socket.IO)
         └────────────────────────┘
```

### Tech Stack Layers

**Frontend Layer**
- React 18 (UI Library)
- Vite (Build Tool)
- Tailwind CSS (Styling)
- React Router (Routing)
- Axios (HTTP Client)
- Socket.IO Client (Real-time)

**Backend Layer**
- Node.js (Runtime)
- Express.js (Web Framework)
- Socket.IO (WebSocket)
- JWT (Authentication)
- Bcrypt (Password Hashing)

**Data Layer**
- MongoDB (Database)
- Mongoose (ODM)
- Redis (Optional - Caching)

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  email: String (required, unique),
  password: String (hashed, required),
  role: String (enum: ['admin', 'member'], default: 'member'),
  avatar: String (URL),
  isOnline: Boolean (default: false),
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  color: String (hex code, default: '#4F46E5'),
  owner: ObjectId (ref: 'User', required),
  members: [ObjectId] (ref: 'User'),
  startDate: Date,
  endDate: Date,
  status: String (enum: ['active', 'completed', 'archived']),
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  project: ObjectId (ref: 'Project', required),
  status: String (enum: ['todo', 'in-progress', 'review', 'done']),
  priority: String (enum: ['low', 'medium', 'high']),
  assignee: ObjectId (ref: 'User'),
  createdBy: ObjectId (ref: 'User', required),
  dueDate: Date,
  tags: [String],
  position: Number,
  attachments: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  type: String (enum: ['task_assigned', 'task_updated', 'comment_added', 'mention']),
  title: String (required),
  message: String (required),
  link: String,
  read: Boolean (default: false),
  createdAt: Date
}
```

## API Reference

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "member"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "member"
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "member",
    "avatar": "avatar-url"
  }
}
```

#### GET /api/auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "user-id",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "member",
    "avatar": "avatar-url",
    "isOnline": true
  }
}
```

### Project Endpoints

#### GET /api/projects
Get all projects for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (active, completed, archived)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "project-id",
      "name": "Website Redesign",
      "description": "Complete redesign of company website",
      "color": "#4F46E5",
      "owner": { ... },
      "members": [ ... ],
      "startDate": "2024-01-01",
      "endDate": "2024-06-30",
      "status": "active"
    }
  ]
}
```

#### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "color": "#4F46E5",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "members": ["user-id-1", "user-id-2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "project-id",
    "name": "New Project",
    ...
  }
}
```

### Task Endpoints

#### GET /api/tasks
Get all tasks with optional filters.

**Query Parameters:**
- `project` (optional): Filter by project ID
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assignee` (optional): Filter by assignee ID

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "task-id",
      "title": "Implement login page",
      "description": "Create login page with validation",
      "project": { ... },
      "status": "in-progress",
      "priority": "high",
      "assignee": { ... },
      "dueDate": "2024-02-15",
      "tags": ["frontend", "authentication"]
    }
  ]
}
```

#### PUT /api/tasks/:id
Update a task.

**Request Body:**
```json
{
  "title": "Updated title",
  "status": "done",
  "priority": "medium"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "task-id",
    "title": "Updated title",
    ...
  }
}
```

## WebSocket Events

### Connection Events

```javascript
// Client connects
socket.on('connect', () => {
  console.log('Connected to server');
});

// Client disconnects
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Project Events

```javascript
// Join a project room
socket.emit('join-project', {
  projectId: 'project-id',
  userId: 'user-id'
});

// Leave a project room
socket.emit('leave-project', {
  projectId: 'project-id',
  userId: 'user-id'
});
```

### Task Events

```javascript
// Task created (broadcast to project room)
socket.on('task-created', (task) => {
  // Update UI with new task
  console.log('New task:', task);
});

// Task updated (broadcast to project room)
socket.on('task-updated', (task) => {
  // Update task in UI
  console.log('Task updated:', task);
});

// Task deleted (broadcast to project room)
socket.on('task-deleted', (taskId) => {
  // Remove task from UI
  console.log('Task deleted:', taskId);
});
```

### User Presence Events

```javascript
// User comes online
socket.on('user-online', (user) => {
  // Update user status in UI
  console.log('User online:', user);
});

// User goes offline
socket.on('user-offline', (userId) => {
  // Update user status in UI
  console.log('User offline:', userId);
});
```

## Component Structure

### Page Components
```
src/pages/
├── Dashboard.jsx          - Main dashboard with stats
├── Projects.jsx           - Project list and management
├── ProjectBoard.jsx       - Kanban board for tasks
├── Tasks.jsx              - Task list view
├── Calendar.jsx           - Calendar with tasks
├── Team.jsx               - Team members management
└── Settings.jsx           - User settings
```

### Feature Components
```
src/components/
├── auth/
│   ├── LoginForm.jsx
│   └── RegisterForm.jsx
├── board/
│   ├── KanbanBoard.jsx
│   ├── KanbanColumn.jsx
│   ├── TaskCard.jsx
│   └── TaskCreateForm.jsx
├── common/
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── LoadingSpinner.jsx
│   └── SkeletonLoaders.jsx
└── dashboard/
    ├── StatsCard.jsx
    ├── ActivityFeed.jsx
    └── RecentTasks.jsx
```

## State Management

### Context Providers

#### AuthContext
Manages user authentication state.

```javascript
const { 
  user,           // Current user object
  login,          // Login function
  logout,         // Logout function
  register,       // Register function
  loading         // Loading state
} = useAuth();
```

#### SocketContext
Manages WebSocket connection.

```javascript
const { 
  socket,         // Socket.IO instance
  connected,      // Connection status
  emit,           // Emit event
  on,             // Listen to event
  off             // Remove listener
} = useSocket();
```

#### NotificationContext
Manages notifications.

```javascript
const { 
  notifications,     // Array of notifications
  unreadCount,       // Count of unread
  markAsRead,        // Mark notification as read
  deleteNotification // Delete notification
} = useNotifications();
```

## Authentication Flow

### Registration Flow
1. User fills registration form
2. Client sends POST to `/api/auth/register`
3. Server validates input
4. Server hashes password with bcrypt
5. Server creates user in database
6. Server generates JWT token
7. Client stores token in localStorage
8. Client redirects to dashboard

### Login Flow
1. User fills login form
2. Client sends POST to `/api/auth/login`
3. Server validates credentials
4. Server compares password hash
5. Server generates JWT token
6. Client stores token in localStorage
7. Client establishes Socket.IO connection
8. Client redirects to dashboard

### Protected Routes
```javascript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## Deployment Guide

### Environment Variables

**Production Backend (.env)**
```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://your-app.vercel.app
```

**Production Frontend (.env)**
```env
VITE_API_URL=https://your-api.onrender.com/api
VITE_SOCKET_URL=https://your-api.onrender.com
```

### Deployment Steps

1. **Database Setup**
   - Create MongoDB Atlas cluster
   - Whitelist IP addresses
   - Get connection string

2. **Backend Deployment (Render)**
   - Connect GitHub repository
   - Set environment variables
   - Deploy web service

3. **Frontend Deployment (Vercel)**
   - Connect GitHub repository
   - Set environment variables
   - Deploy application

4. **Post-Deployment**
   - Test all API endpoints
   - Verify WebSocket connections
   - Test real-time features
   - Monitor error logs

### Performance Optimization

**Backend**
- Enable gzip compression
- Implement rate limiting
- Use database indexing
- Cache frequently accessed data

**Frontend**
- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Service worker for PWA

## Security Best Practices

1. **Authentication**
   - Use strong JWT secrets
   - Implement token expiration
   - Validate all inputs
   - Hash passwords with bcrypt

2. **API Security**
   - Enable CORS properly
   - Implement rate limiting
   - Validate request data
   - Use HTTPS in production

3. **Database**
   - Use parameterized queries
   - Implement proper indexing
   - Regular backups
   - Monitor database access

## Monitoring & Logging

### Error Tracking
- Use error boundaries in React
- Log errors to console in development
- Use logging service in production (e.g., Sentry)

### Performance Monitoring
- Monitor API response times
- Track WebSocket connection stability
- Monitor database query performance
- Use React DevTools for component performance

---

**Last Updated**: January 2024
**Version**: 1.0.0
