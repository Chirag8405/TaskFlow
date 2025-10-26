# 🔧 Deployment Troubleshooting Guide

Common issues and solutions for TaskFlow deployment.

---

## 🚨 Backend Issues

### Issue 1: "Build Failed" on Render/Railway

**Symptoms:**
- Deployment fails during build phase
- Error: "Cannot find module" or "npm ERR!"

**Solutions:**

✅ **Check package.json location**
```bash
# Verify package.json exists in server directory
ls server/package.json
```

✅ **Verify build command**
```bash
# Render/Railway build command should be:
cd server && npm install
```

✅ **Check Node version**
```json
// Add to server/package.json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

✅ **Clear cache and redeploy**
- Render: Dashboard → Manual Deploy → "Clear build cache & deploy"
- Railway: Settings → Delete deployment → Redeploy

---

### Issue 2: "Application Failed to Start"

**Symptoms:**
- Build succeeds but app crashes on start
- Error: "Port already in use" or "Cannot connect to database"

**Solutions:**

✅ **Check start command**
```bash
# Should be:
cd server && npm start

# NOT just:
npm start  # ❌ Wrong! Will look for package.json in root
```

✅ **Verify environment variables**
```bash
# All required variables set?
NODE_ENV=production  ✓
MONGO_URI=mongodb+srv://...  ✓
JWT_SECRET=...  ✓
PORT=5000  ✓
CLIENT_URL=https://...  ✓
```

✅ **Check MongoDB connection**
```bash
# Test connection string format:
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority

# Common mistakes:
# ❌ Missing database name
# ❌ Special characters not URL-encoded
# ❌ Wrong username/password
```

✅ **Check PORT environment variable**
```javascript
// server/server.js should use:
const PORT = process.env.PORT || 5000;
```

---

### Issue 3: "Cannot GET /api/health" (404 Error)

**Symptoms:**
- Backend URL returns 404
- Health check endpoint not found

**Solutions:**

✅ **Verify health endpoint exists**
```javascript
// Check server/server.js has:
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', ... });
});
```

✅ **Check route before error middleware**
```javascript
// Health endpoint should be BEFORE error handlers
app.get('/api/health', ...);  // ✓ First

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Error handlers last
app.use(errorHandler);  // ✓ Last
```

✅ **Test locally first**
```bash
cd server
npm start
curl http://localhost:5000/api/health
```

---

### Issue 4: Backend Sleeps/Slow Response (Free Tier)

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests are fast
- Happens after 15-30 minutes of inactivity

**Solutions:**

✅ **This is NORMAL on free tiers**
- Render: Sleeps after 15 minutes
- Railway: Sleeps when credit limit reached
- Cold start: ~30-60 seconds

✅ **Workaround: Keep-alive ping**
```javascript
// Add to frontend (optional)
setInterval(() => {
  fetch(`${API_URL}/health`);
}, 14 * 60 * 1000); // Ping every 14 minutes
```

✅ **Upgrade to paid plan**
- Render: $7/month for 24/7 uptime
- Railway: Pay-as-you-go for always-on

---

## 🌐 Frontend Issues

### Issue 5: "Network Error" or "Failed to Fetch"

**Symptoms:**
- Frontend loads but API calls fail
- Error: "Network Error" or "Failed to fetch"
- CORS errors in browser console

**Solutions:**

✅ **Check API URL in Vercel environment variables**
```bash
# Must match backend URL exactly
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com

# Common mistakes:
# ❌ Missing /api suffix on VITE_API_URL
# ❌ Trailing slash: /api/
# ❌ Wrong backend URL
```

✅ **Verify CORS configuration on backend**
```bash
# Backend CLIENT_URL must match frontend
CLIENT_URL=https://your-app.vercel.app

# NOT:
# ❌ http:// (must be https://)
# ❌ Trailing slash
# ❌ www. prefix if not used
```

✅ **Check browser console for specific error**
```bash
# Press F12 → Console tab
# Look for CORS error message

# If you see: "Access-Control-Allow-Origin"
# → CLIENT_URL is wrong on backend

# If you see: "net::ERR_NAME_NOT_RESOLVED"
# → API URL is wrong on frontend
```

✅ **Test backend directly**
```bash
# Try accessing backend health check
curl https://your-backend.onrender.com/api/health

# If this fails, backend has issues
# If this works, CORS configuration is the problem
```

---

### Issue 6: "VITE_API_URL is undefined"

**Symptoms:**
- API calls go to wrong URL
- Console shows `undefined/api/tasks`

**Solutions:**

✅ **Redeploy after adding environment variables**
```bash
# Vercel doesn't auto-redeploy on env var changes
# Go to: Vercel Dashboard → Deployments → Redeploy
```

✅ **Check environment variable names**
```bash
# Must start with VITE_
VITE_API_URL=...  ✓
API_URL=...  ❌ Won't work!
```

✅ **Verify .env.production is committed**
```bash
# Check if file exists
git ls-files client/.env.production

# If not, add it:
git add client/.env.production
git commit -m "Add production env"
git push
```

---

### Issue 7: "White Screen" or "Page Not Found"

**Symptoms:**
- Vercel deploys successfully
- But page shows white screen or 404

**Solutions:**

✅ **Check vercel.json routes**
```json
{
  "routes": [
    { "src": "/assets/(.*)", "dest": "/assets/$1" },
    { "src": "/(.*)", "dest": "/index.html" }  // ✓ Catch-all route
  ]
}
```

✅ **Verify build output directory**
```json
// vercel.json
{
  "builds": [{
    "src": "package.json",
    "use": "@vercel/static-build",
    "config": { "distDir": "dist" }  // ✓ Must match Vite output
  }]
}
```

✅ **Check build logs**
```bash
# Vercel Dashboard → Deployment → Build Logs
# Look for:
# ✓ "Build Completed"
# ✓ "Output Directory: dist"
```

---

## 💾 Database Issues

### Issue 8: "Cannot Connect to MongoDB"

**Symptoms:**
- Backend starts but crashes on first request
- Error: "MongoServerError" or "ECONNREFUSED"

**Solutions:**

✅ **Verify connection string format**
```bash
# Correct format:
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority

# Check:
✓ username and password are correct
✓ Database name is included (dbname)
✓ Special characters in password are URL-encoded
```

✅ **URL-encode special characters in password**
```bash
# If password contains special characters:
# @ → %40
# : → %3A
# / → %2F
# ? → %3F
# # → %23

# Example:
# Password: Pass@123
# Encoded:  Pass%40123
```

✅ **Check IP whitelist**
```bash
# MongoDB Atlas → Network Access
# Must include: 0.0.0.0/0 (Allow from anywhere)

# For specific IPs (more secure):
# Get backend IP from Render/Railway
# Add specific IP to whitelist
```

✅ **Verify database user exists**
```bash
# MongoDB Atlas → Database Access
# User must have "Read and write to any database" permission
```

---

### Issue 9: "Authentication Failed" (MongoDB)

**Symptoms:**
- Error: "Authentication failed"
- Backend can't connect to database

**Solutions:**

✅ **Check username and password**
```bash
# MongoDB Atlas → Database Access → Edit User
# Verify username matches connection string
# Reset password if unsure
```

✅ **Don't use database admin credentials**
```bash
# Create a new database user specifically for the app
# Use that user's credentials, not your Atlas account
```

---

## 🔌 WebSocket/Real-time Issues

### Issue 10: "Socket Connection Failed"

**Symptoms:**
- API calls work, but real-time updates don't
- Console: "WebSocket connection failed"

**Solutions:**

✅ **Check VITE_SOCKET_URL**
```bash
# Must match backend URL exactly
VITE_SOCKET_URL=https://your-backend.onrender.com

# NOT:
# ❌ /api suffix on socket URL
# ❌ Different domain
```

✅ **Verify Socket.io CORS on backend**
```javascript
// server/config/socket.js
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL.split(','),  // ✓
    credentials: true
  },
  transports: ['websocket', 'polling']  // ✓ Important!
});
```

✅ **Check browser console**
```bash
# Press F12 → Network tab → Filter: WS
# Should see successful WebSocket connection

# If you see "Connection rejected"
# → CORS issue on backend

# If you see "Connection timeout"
# → Socket URL is wrong
```

---

### Issue 11: "Real-time Updates Not Working"

**Symptoms:**
- Socket connects successfully
- But updates don't appear in real-time

**Solutions:**

✅ **Check socket event names match**
```javascript
// Backend emits:
io.emit('taskUpdated', task);

// Frontend listens for:
socket.on('taskUpdated', handleUpdate);  // ✓ Must match exactly
```

✅ **Verify user is in the right room**
```javascript
// Backend should join user to project room
socket.join(`project_${projectId}`);

// And emit to that room
io.to(`project_${projectId}`).emit('taskUpdated', task);
```

✅ **Check socket connection status**
```javascript
// Add to frontend
useEffect(() => {
  console.log('Socket connected:', socket.connected);
  console.log('Socket ID:', socket.id);
}, [socket]);
```

---

## 🔐 Authentication Issues

### Issue 12: "JWT Token Invalid" or "Unauthorized"

**Symptoms:**
- Can register/login
- But subsequent requests fail with 401 Unauthorized

**Solutions:**

✅ **Check JWT_SECRET matches**
```bash
# Backend must have JWT_SECRET set
# Use same secret for all backend instances
# Generate strong secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

✅ **Verify token is being sent**
```bash
# Browser DevTools → Network → Request Headers
# Should see: Authorization: Bearer eyJhbGc...

# If missing, check frontend api.js:
const token = localStorage.getItem('token');
headers['Authorization'] = `Bearer ${token}`;
```

✅ **Check token expiration**
```javascript
// Backend JWT config
jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

// If expired, user needs to login again
```

---

### Issue 13: "Login Successful but Dashboard Shows Error"

**Symptoms:**
- Login works
- Token is saved
- But dashboard API calls fail

**Solutions:**

✅ **Check token storage**
```javascript
// After login, verify token is saved
localStorage.getItem('token');  // Should return token string
```

✅ **Verify API requests include token**
```javascript
// client/src/services/api.js
const token = localStorage.getItem('token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

✅ **Check backend auth middleware**
```javascript
// Should extract token from header
const token = req.headers.authorization?.split(' ')[1];
```

---

## 🔄 Deployment-Specific Issues

### Issue 14: "Environment Variables Not Working"

**Symptoms:**
- Env vars work locally
- But not in production

**Solutions:**

✅ **Render: Check variable sync**
```bash
# Render Dashboard → Environment
# Variables marked "sync: false" need manual entry
# After adding, click "Save Changes"
# Wait for automatic redeploy
```

✅ **Railway: Check variable format**
```bash
# Railway Dashboard → Variables
# No quotes needed:
NODE_ENV=production  ✓
NODE_ENV="production"  ❌ (may cause issues)
```

✅ **Vercel: Redeploy after changes**
```bash
# Vercel doesn't auto-redeploy on env var changes
# Settings → Environment Variables → Add
# Then: Deployments → Redeploy
```

---

### Issue 15: "Works Locally but Not in Production"

**Symptoms:**
- Everything works on localhost
- Fails in production

**Solutions:**

✅ **Check NODE_ENV differences**
```javascript
// Code that depends on NODE_ENV
if (process.env.NODE_ENV === 'development') {
  // This won't run in production!
}
```

✅ **Check hardcoded URLs**
```javascript
// ❌ Bad:
const API_URL = 'http://localhost:5000';

// ✓ Good:
const API_URL = process.env.VITE_API_URL;
```

✅ **Check file paths (case-sensitive)**
```javascript
// ❌ May work on Mac/Windows but fail on Linux:
import Component from './component';

// ✓ Match exact filename case:
import Component from './Component';
```

---

## 🛠️ General Debugging Steps

### Step 1: Check Platform Status
```bash
# Verify platforms are operational
https://www.vercelstatus.com
https://status.render.com
https://status.railway.app
https://status.mongodb.com
```

### Step 2: Check Logs
```bash
# Render: Dashboard → Logs tab
# Railway: Click service → Logs
# Vercel: Deployment → Functions
# MongoDB: Atlas → Metrics
```

### Step 3: Test Components Individually
```bash
# Test backend health:
curl https://your-backend.com/api/health

# Test database connection:
# (Check backend logs for MongoDB connection success)

# Test frontend:
# Open browser DevTools → Console
# Look for errors
```

### Step 4: Compare with Working Setup
```bash
# Check .env.example files
# Compare with your actual .env
# Ensure all variables are set
```

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Read this troubleshooting guide
2. ✅ Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. ✅ Review platform logs
4. ✅ Test components individually
5. ✅ Check browser console
6. ✅ Verify environment variables

### When Reporting an Issue

Include:
- Platform (Render/Railway/Vercel)
- Error message (exact text)
- Browser console logs
- Backend logs
- Steps to reproduce
- Environment variables (without sensitive data)

---

## ✅ Quick Verification Checklist

Use this to verify your deployment:

### Backend
- [ ] Health endpoint returns 200: `/api/health`
- [ ] Can access API docs/routes
- [ ] MongoDB connection successful (check logs)
- [ ] Environment variables all set
- [ ] CORS allows frontend domain

### Frontend
- [ ] Page loads without errors
- [ ] Can see console logs (no red errors)
- [ ] Environment variables loaded
- [ ] API calls succeed (check Network tab)
- [ ] Socket.io connects (check WS in Network tab)

### Integration
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard loads with data
- [ ] Can create project
- [ ] Can create task
- [ ] Real-time updates work (test with 2 windows)

---

## 🎯 Still Stuck?

1. **Start fresh**: Delete deployment and create new one
2. **Test locally**: Ensure it works on localhost first
3. **One platform at a time**: Test each component separately
4. **Check examples**: Compare with working deployments
5. **Ask for help**: Provide detailed error information

---

**Remember**: 90% of deployment issues are:
1. Wrong environment variables
2. CORS misconfiguration
3. Incorrect URLs
4. Missing database connection

**Check these first!** ✅
