# Quick Start Guide

Welcome to Real-Time Task Manager! This guide will help you get up and running in 5 minutes.

## 🚀 Quick Setup

### Option 1: Docker (Recommended - Fastest)

```bash
# Clone the repository
git clone <your-repo-url>
cd realtime-task-manager

# Start everything with Docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

That's it! The application is running with MongoDB, backend, and frontend all configured.

### Option 2: Manual Setup

```bash
# 1. Install MongoDB locally or use MongoDB Atlas

# 2. Setup Backend
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev

# 3. Setup Frontend (in a new terminal)
cd client
npm install
cp .env.example .env
# Edit .env if needed
npm run dev

# 4. Access at http://localhost:5173
```

## 📝 First Steps

### 1. Register an Account
- Navigate to http://localhost:5173
- Click "Register" 
- Fill in your details
- You'll be automatically logged in

### 2. Create Your First Project
- Click "Projects" in the sidebar
- Click "+ New Project"
- Enter project details:
  - Name: e.g., "My First Project"
  - Description: Brief description
  - Pick a color
  - Set dates (optional)
- Click "Create Project"

### 3. Create Tasks
- Click on your project to open the Kanban board
- Click "+ New Task" in any column
- Fill in task details:
  - Title: What needs to be done
  - Description: More details
  - Priority: Low, Medium, or High
  - Due Date: When it's due
  - Tags: Add relevant tags
- Click "Create Task"

### 4. Organize Tasks
- **Drag and drop** tasks between columns
- Click the **3-dot menu** on any task to:
  - Edit task details
  - Delete task
  - Change assignee
- Use **filters** at the top to find specific tasks

### 5. Collaborate (Test Real-time Features)
- Open the app in **two browser windows**
- Create/edit/move a task in one window
- Watch it **update instantly** in the other window!

## 🎯 Common Tasks

### Viewing All Tasks
```
Dashboard → Shows overview with recent tasks
Tasks Page → Shows all tasks in a list view
Project Board → Shows tasks in Kanban columns
Calendar → Shows tasks on calendar view
```

### Managing Team Members
```
Team Page → View all users
Projects → Add members when creating/editing
Task → Assign tasks to team members
```

### Finding Tasks
```
Use Search Bar → Search by title/description
Use Filters → Filter by status, priority, assignee
Use Tags → Click tags to see related tasks
```

### Customizing Your Profile
```
Settings → Update preferences
Profile → Change avatar, update info, change password
```

## 💡 Pro Tips

### Keyboard Shortcuts (Coming Soon)
```
Ctrl + N  → New Task
Ctrl + P  → New Project
Ctrl + K  → Search
Esc       → Close Modal
```

### Task Management Best Practices
1. **Use Clear Titles** - "Fix login bug" instead of "Bug"
2. **Set Priorities** - Help team focus on what matters
3. **Add Due Dates** - Keep projects on track
4. **Use Tags** - Group related tasks (e.g., #frontend #bug)
5. **Move Tasks Daily** - Update status as you work

### Project Organization
1. **One Project per Goal** - e.g., "Website Redesign", "Mobile App v2"
2. **Invite Team Members** - Collaboration is key
3. **Use Colors** - Differentiate projects visually
4. **Archive Completed** - Keep workspace clean

## 🔧 Development Tips

### Running Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

### Checking Logs
```bash
# Docker logs
docker-compose logs -f

# Backend logs
cd server && npm run dev

# Frontend logs
cd client && npm run dev
```

### Making Changes
```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and test
npm run dev

# Commit with conventional commits
git commit -m "feat: add new feature"
```

### Database Operations
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/realtime_task_manager

# View collections
show collections

# Query tasks
db.tasks.find().pretty()

# Clear database (careful!)
db.dropDatabase()
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>

# Or use different port in .env
PORT=5001
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string
echo $MONGO_URI
```

### Frontend Not Loading
```bash
# Clear cache
rm -rf client/node_modules client/.vite
cd client && npm install

# Check backend is running
curl http://localhost:5000/api/health
```

### Socket.IO Not Connecting
```bash
# Check CORS settings in backend
# Verify VITE_SOCKET_URL in frontend .env
# Check browser console for errors
# Try different browser
```

## 📚 Next Steps

1. **Read Full Documentation**
   - [README.md](./README.md) - Complete setup guide
   - [DOCUMENTATION.md](./DOCUMENTATION.md) - API reference
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute

2. **Explore Features**
   - Try all pages (Dashboard, Projects, Tasks, Calendar, Team)
   - Test real-time updates
   - Customize your profile
   - Invite team members

3. **Test API with Postman**
   - Import `TaskManager.postman_collection.json`
   - Test all endpoints
   - See request/response examples

4. **Deploy to Production**
   - Follow deployment guide in README
   - Use Vercel + Render + MongoDB Atlas (all free)
   - Set up custom domain

## 🎓 Learning Resources

### Technologies Used
- **React** → [react.dev](https://react.dev/)
- **Node.js** → [nodejs.org](https://nodejs.org/)
- **Express** → [expressjs.com](https://expressjs.com/)
- **MongoDB** → [docs.mongodb.com](https://docs.mongodb.com/)
- **Socket.IO** → [socket.io/docs](https://socket.io/docs/)
- **Tailwind CSS** → [tailwindcss.com](https://tailwindcss.com/)

### Project Structure
```
realtime-task-manager/
├── client/          → React frontend
├── server/          → Node.js backend
├── docs/            → Documentation
└── .github/         → CI/CD workflows
```

## ❓ Need Help?

- **Issues?** → Open a GitHub issue
- **Questions?** → Check documentation
- **Bugs?** → Report with details
- **Ideas?** → Submit feature request

---

**Happy Task Managing! 🎉**

_Built with ❤️ using React, Node.js, MongoDB, and Socket.IO_
