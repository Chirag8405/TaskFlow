# Development Quick Start Guide

## 🚀 Quick Commands

### Start Everything (Recommended)
```bash
# From project root - starts both frontend and backend
npm run dev
# or
./dev.sh
```

### Start Individual Services

#### Backend Only
```bash
cd server
npm run dev          # Auto-kills port 5000, then starts with nodemon
npm run dev:simple   # Simple version (kills node processes)
npm run dev:clean    # Kills using fuser (alternative method)
npm start            # Production mode (no auto-restart)
```

#### Frontend Only
```bash
cd client
npm run dev          # Auto-kills port 5173, then starts with Vite
```

### From Root Directory
```bash
npm run dev:server   # Start backend only
npm run dev:client   # Start frontend only
npm run clean:ports  # Kill all processes on ports 5000 and 5173
npm run logs         # View both server logs
npm run logs:server  # View backend logs only
npm run logs:client  # View frontend logs only
```

## 🛠️ Port Management

### Automatic Port Cleanup
The `npm run dev` commands now automatically:
1. ✅ Kill any process using port 5000 (backend) or 5173 (frontend)
2. ✅ Kill lingering node/vite processes
3. ✅ Start fresh server instance

### Manual Port Cleanup
If you need to manually free up ports:

```bash
# Kill specific port
lsof -ti:5000 | xargs kill -9   # Backend
lsof -ti:5173 | xargs kill -9   # Frontend

# Or use the cleanup script
npm run clean:ports
```

## 📋 Common Issues & Solutions

### "Port Already in Use"
✅ **Solution**: Just run `npm run dev` - it handles this automatically!

### "EADDRINUSE: address already in use"
```bash
# Option 1: Use the new dev script (recommended)
npm run dev

# Option 2: Manual cleanup
npm run clean:ports
```

### "Cannot find module" errors
```bash
# Reinstall dependencies
cd server && npm install
cd ../client && npm install

# Or from root
npm run install:all
```

### Server won't start
```bash
# Check what's using the port
lsof -i :5000

# View server logs
npm run logs:server

# Try clean restart
npm run clean:ports
cd server && npm run dev
```

## 🎯 Development Workflow

### Initial Setup
```bash
# 1. Clone and install
git clone <repo-url>
cd realtime-task-manager
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit .env files with your settings

# 3. Start development
npm run dev
```

### Daily Development
```bash
# Start servers (kills old processes automatically)
npm run dev

# Work on your code...

# Restart if needed - just run again
npm run dev  # It will auto-cleanup!

# Stop everything
# Press CTRL+C in terminal
```

### Viewing Logs
```bash
# Real-time logs (both servers)
npm run logs

# Just backend
npm run logs:server

# Just frontend  
npm run logs:client

# Or check the files directly
tail -f server.log
tail -f client.log
```

## 🌐 Access URLs

After running `npm run dev`, access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Socket.IO**: ws://localhost:5000

## 🐛 Debug Mode

### Backend Debug
```bash
cd server
DEBUG=* npm run dev
```

### Check Server Status
```bash
# Check if servers are running
ps aux | grep "node.*server"
ps aux | grep "vite"

# Check ports
lsof -i :5000
lsof -i :5173
```

## 📦 Scripts Reference

### Root Package Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start both servers with auto-cleanup |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run clean:ports` | Kill all server processes |
| `npm run logs` | View all logs |
| `npm run install:all` | Install all dependencies |
| `npm run build` | Build frontend for production |
| `npm run clean` | Remove all node_modules |

### Server Scripts
| Script | Description |
|--------|-------------|
| `npm start` | Production mode |
| `npm run dev` | Development with auto-cleanup |
| `npm run dev:simple` | Simple dev mode |
| `npm run dev:clean` | Dev with fuser cleanup |

### Client Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Development with auto-cleanup |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## 🔧 Advanced Usage

### Custom Port for Backend
Edit `server/.env`:
```env
PORT=5000
```
Then update the cleanup script in `server/start-dev.sh` if using different port.

### Custom Port for Frontend
Edit `client/vite.config.js`:
```js
export default {
  server: {
    port: 5173
  }
}
```

## ✨ Features

- ✅ **Automatic port cleanup** - No more "port in use" errors!
- ✅ **Process management** - Kills lingering processes
- ✅ **Hot reload** - Nodemon (backend) and Vite HMR (frontend)
- ✅ **Log management** - Separate log files for each service
- ✅ **One command start** - `npm run dev` starts everything
- ✅ **Workspace support** - Manage both client and server from root

## 🎉 Tips

1. **Always use `npm run dev`** - It handles all the cleanup automatically
2. **Keep terminals organized** - Use split panes or separate terminals
3. **Watch the logs** - Use `npm run logs` to monitor both services
4. **Don't worry about old processes** - The script handles cleanup
5. **CTRL+C to stop** - Always stops cleanly

---

**Need help?** Open an issue or check the main README.md
