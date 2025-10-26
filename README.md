# Real-Time Collaborative Task Management System

A Trello-like task management application built with modern web technologies that enables real-time collaboration between multiple users.

## 🚀 Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can work simultaneously with instant updates
- **Kanban Board**: Drag-and-drop task management with customizable columns
- **User Authentication**: Secure JWT-based authentication system
- **Project Management**: Create and manage multiple projects with team collaboration
- **Role-based Access**: Admin and Member roles with different permissions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Real-time Features
- ✅ Live task updates across all connected users
- ✅ Real-time user presence indicators
- ✅ Instant notifications for task changes
- ✅ Live commenting system (optional)
- ✅ Online/offline status tracking

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time bidirectional communication
- **React Beautiful DnD** - Drag and drop functionality
- **Lucide React** - Beautiful, customizable icons

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **Socket.io** - Real-time WebSocket communication
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - MongoDB object modeling for Node.js
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing library

### DevOps & Deployment
- **Docker** - Containerization for consistent development
- **GitHub Actions** - CI/CD pipeline automation
- **Vercel** - Frontend deployment and hosting
- **Render** - Backend API deployment
- **MongoDB Atlas** - Cloud database hosting

## 📋 Project Structure

```
realtime-task-manager/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── board/         # Task board components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── layout/        # Layout components
│   │   │   └── common/        # Common UI components
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service functions
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── server/                     # Node.js backend application
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose schemas
│   ├── routes/                # API routes
│   ├── socket/                # Socket.io handlers
│   ├── utils/                 # Backend utilities
│   └── package.json           # Backend dependencies
├── docker-compose.yml         # Docker composition file
├── .github/                   # GitHub Actions workflows
└── README.md                  # Project documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-task-manager
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configure your environment variables in .env
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Configure your environment variables in .env
   npm run dev
   ```

4. **Docker Setup (Alternative)**
   ```bash
   docker-compose up -d
   ```

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/realtime_task_manager

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# Optional: Email Service (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Optional: Analytics
VITE_GA_TRACKING_ID=your-google-analytics-id
```

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - User login
GET    /api/auth/me                    - Get current user
POST   /api/auth/logout                - User logout
```

### Project Endpoints
```
GET    /api/projects                   - Get all user projects
POST   /api/projects                   - Create new project
GET    /api/projects/:id               - Get project details
PUT    /api/projects/:id               - Update project
DELETE /api/projects/:id               - Delete project
POST   /api/projects/:id/members       - Add member to project
DELETE /api/projects/:id/members/:userId - Remove member
```

### Task Endpoints
```
GET    /api/tasks                      - Get all tasks (filterable)
POST   /api/tasks                      - Create new task
GET    /api/tasks/:id                  - Get single task details
PUT    /api/tasks/:id                  - Update task
DELETE /api/tasks/:id                  - Delete task
PATCH  /api/tasks/:id/move             - Move task between columns
PATCH  /api/tasks/:id/assign           - Assign task to user
GET    /api/tasks/recent               - Get recent tasks
GET    /api/tasks/project/:projectId   - Get project tasks
```

### User Endpoints
```
GET    /api/users                      - Get all users
GET    /api/users/profile              - Get user profile
PUT    /api/users/profile              - Update user profile
PUT    /api/users/change-password      - Change password
POST   /api/users/avatar               - Upload avatar
GET    /api/users/online               - Get online users
```

### Notification Endpoints
```
GET    /api/notifications              - Get user notifications
GET    /api/notifications/unread       - Get unread count
PUT    /api/notifications/:id/read     - Mark notification as read
PUT    /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
```

## 🔌 WebSocket Events

### Client → Server Events
```javascript
// Join/Leave project rooms
socket.emit('join-project', { projectId, userId })
socket.emit('leave-project', { projectId, userId })

// Task operations
socket.emit('task-created', taskData)
socket.emit('task-updated', { taskId, updates })
socket.emit('task-deleted', { taskId })
socket.emit('task-moved', { taskId, newStatus })

// User presence
socket.emit('user-online', { userId, username })
socket.emit('user-offline', { userId })
```

### Server → Client Events
```javascript
// Task notifications
socket.on('task-created', (task) => { /* Update UI */ })
socket.on('task-updated', (task) => { /* Update UI */ })
socket.on('task-deleted', (taskId) => { /* Remove from UI */ })
socket.on('task-moved', (task) => { /* Update board */ })

// User presence
socket.on('user-online', (user) => { /* Show online status */ })
socket.on('user-offline', (userId) => { /* Show offline status */ })

// Notifications
socket.on('notification', (notification) => { /* Show toast */ })
```

### Connection Events
```javascript
socket.on('connect', () => console.log('Connected to server'))
socket.on('disconnect', () => console.log('Disconnected'))
socket.on('error', (error) => console.error('Socket error:', error))
```

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Frontend Testing
```bash
cd client
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Manual Testing
1. **Authentication Flow**
   - Register new user
   - Login with credentials
   - Verify JWT token storage
   - Test protected routes

2. **Real-time Features**
   - Open app in two browser windows
   - Create/update/delete tasks in one window
   - Verify instant updates in second window

3. **Drag and Drop**
   - Test task movement between columns
   - Verify position persistence
   - Check real-time sync

### API Testing with Postman
Import the Postman collection:
1. Open Postman
2. Import → Upload Files
3. Select `/docs/postman-collection.json`
4. Configure environment variables
5. Run collection tests

## 🚀 Deployment

### Prerequisites for Deployment
- GitHub account
- Vercel account (free tier)
- Render account (free tier)
- MongoDB Atlas account (free M0 cluster)

### Step 1: Database Setup (MongoDB Atlas)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster (512MB storage)
3. Create database user with password
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Step 2: Backend Deployment (Render)
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. New → Web Service
4. Connect GitHub repository
5. Configure:
   - **Name**: `realtime-task-manager-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Instance Type**: Free
6. Add environment variables:
   ```
   NODE_ENV=production
   MONGO_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<generate-random-secret>
   CORS_ORIGIN=https://your-frontend.vercel.app
   PORT=10000
   ```
7. Create Web Service
8. Note your backend URL: `https://realtime-task-manager-api.onrender.com`

### Step 3: Frontend Deployment (Vercel)
1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. New Project → Import Git Repository
4. Select your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   ```
   VITE_API_URL=https://realtime-task-manager-api.onrender.com/api
   VITE_SOCKET_URL=https://realtime-task-manager-api.onrender.com
   ```
7. Deploy
8. Your app is live at: `https://your-app.vercel.app`

### Step 4: Post-Deployment Configuration
1. **Update CORS** in backend `.env`:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
2. **Test real-time features** with multiple browser windows
3. **Monitor logs** in Render dashboard
4. **Set up custom domain** (optional)

### Continuous Deployment
- **Automatic**: Push to `main` branch triggers deployment
- **Manual**: Use dashboard to redeploy
- **Preview**: Pull requests create preview deployments on Vercel

### Production Checklist
- ✅ Environment variables configured
- ✅ MongoDB Atlas connection working
- ✅ CORS properly configured
- ✅ JWT secret is secure and random
- ✅ Socket.IO connects successfully
- ✅ All API endpoints functional
- ✅ Real-time updates working
- ✅ Error handling in place
- ✅ Logs monitored

## 🎯 Project Timeline

- **Day 1**: Project setup, authentication, and basic API
- **Day 2**: Frontend setup, authentication UI, and dashboard
- **Day 3**: Task management and board implementation
- **Day 4**: Real-time features and Socket.io integration
- **Day 5**: Testing, deployment, and documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [Your Name]
- **Project Type**: Academic Full-Stack Development Project
- **Duration**: 5 Days
- **Technologies**: React, Node.js, MongoDB, Socket.io

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port
lsof -i :5000
# Kill the process
kill -9 <PID>
```

**2. MongoDB Connection Failed**
- Verify MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Ensure network access in MongoDB Atlas

**3. Socket.IO Connection Error**
- Check CORS configuration
- Verify Socket.IO URLs match backend
- Check browser console for errors

**4. Docker Issues**
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up --build
```

**5. Module Not Found Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode
Enable debug logging:
```bash
# Backend
DEBUG=* npm run dev

# Check logs
docker-compose logs -f backend
```

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [Performance Report](./performance-report.md) - Optimization details

## 🚀 Production Deployment

This application is production-ready and can be deployed on:

### Quick Deploy Links
- **Frontend**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/realtime-task-manager)
- **Backend**: [Deploy on Render](https://render.com) or [Deploy on Railway](https://railway.app)
- **Database**: [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas)

### Deployment Guides
1. 📘 [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md) - Full step-by-step instructions
2. ✅ [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Ensure nothing is missed
3. 🔧 [Environment Variables](./server/.env.example) - Configuration templates

### Platform Configuration Files
- **Vercel**: `client/vercel.json` ✅
- **Render**: `render.yaml` ✅
- **Railway**: `railway.json` ✅
- **Docker**: `docker-compose.prod.yml` ✅

**Estimated Deployment Time**: 30-45 minutes

## 🎬 Demo

**Live Demo**: [Coming Soon](#)

**Test Account**:
- Register your own account to try all features
- Admin features available after registration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Implements key software engineering concepts:
  - Event-Driven Architecture
  - Real-time Communication (WebSockets)
  - RESTful API Design
  - JWT Authentication
  - Role-Based Access Control (RBAC)
  - Responsive Design Principles
  - Component-Based Architecture
  - State Management with Context API

---

⭐ **Star this repository if you found it helpful!**

📝 **Built with ❤️ for collaborative productivity**

🚀 **Ready for production deployment!**