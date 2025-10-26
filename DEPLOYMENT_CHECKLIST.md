# 🚀 TaskFlow Deployment Checklist

Use this checklist to ensure a smooth deployment process.

---

## 📋 Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] All features tested locally
- [ ] No console errors or warnings
- [ ] Dependencies up to date (`npm audit`)

---

## 🗄️ MongoDB Atlas Setup

- [ ] Created MongoDB Atlas account
- [ ] Created new cluster (Free M0 tier)
- [ ] Created database user with strong password
- [ ] Added IP whitelist: `0.0.0.0/0`
- [ ] Copied connection string
- [ ] Replaced `<username>` and `<password>` in connection string
- [ ] Added database name to connection string (e.g., `/taskflow`)
- [ ] Tested connection string locally (optional)

**Connection String Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
```

---

## 🖥️ Backend Deployment (Render or Railway)

### Common Steps (Both Platforms)

- [ ] Generated strong JWT secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Saved JWT secret securely

### If Using Render:

- [ ] Created Render account
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Set Root Directory: (leave empty)
- [ ] Set Build Command: `cd server && npm install`
- [ ] Set Start Command: `cd server && npm start`
- [ ] Added environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `MONGO_URI=<your_connection_string>`
  - [ ] `JWT_SECRET=<your_generated_secret>`
  - [ ] `PORT=5000`
  - [ ] `CLIENT_URL=` (will update after Vercel deployment)
- [ ] Deployed service
- [ ] Copied backend URL (e.g., `https://taskflow-backend.onrender.com`)
- [ ] Tested health endpoint: `/api/health`

### If Using Railway:

- [ ] Created Railway account
- [ ] Created new project from GitHub
- [ ] Set Root Directory: `server`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Added environment variables (same as Render above)
- [ ] Generated domain in Settings → Networking
- [ ] Copied backend URL (e.g., `https://taskflow-backend.up.railway.app`)
- [ ] Tested health endpoint: `/api/health`

**Backend URL:** _________________________________

---

## 🌐 Frontend Deployment (Vercel)

- [ ] Updated `client/.env.production`:
  ```bash
  VITE_API_URL=<your_backend_url>/api
  VITE_SOCKET_URL=<your_backend_url>
  ```
- [ ] Committed and pushed changes to GitHub
- [ ] Created Vercel account
- [ ] Imported GitHub repository
- [ ] Set Framework: Vite
- [ ] Set Root Directory: `client`
- [ ] Set Build Command: `npm run build`
- [ ] Set Output Directory: `dist`
- [ ] Added environment variables:
  - [ ] `VITE_API_URL=<your_backend_url>/api`
  - [ ] `VITE_SOCKET_URL=<your_backend_url>`
- [ ] Deployed to Vercel
- [ ] Copied frontend URL (e.g., `https://taskflow.vercel.app`)

**Frontend URL:** _________________________________

---

## 🔄 Update Backend CORS

- [ ] Went back to Render/Railway
- [ ] Updated `CLIENT_URL` environment variable to Vercel URL
- [ ] Saved and waited for automatic redeployment
- [ ] Verified deployment completed

---

## ✅ Post-Deployment Testing

### Backend Health Check
- [ ] Visited: `<backend_url>/api/health`
- [ ] Received JSON response with `"status": "healthy"`

### Frontend Functionality
- [ ] Visited frontend URL
- [ ] Page loads without errors
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard displays correctly

### Full Feature Testing
- [ ] Can create projects
- [ ] Can create tasks
- [ ] Can update task status
- [ ] Drag-and-drop works
- [ ] Search functionality works
- [ ] User avatars display correctly
- [ ] Real-time updates work (test with two browser windows)
- [ ] Notifications work
- [ ] File uploads work (if applicable)

### Real-Time Features (Critical)
- [ ] Opened two browser windows side-by-side
- [ ] Logged in as same user in both
- [ ] Created a task in window 1
- [ ] Confirmed task appeared in window 2 without refresh
- [ ] Updated task status in window 2
- [ ] Confirmed update reflected in window 1

---

## 🔐 Security Checklist

- [ ] `.env` files NOT committed to GitHub
- [ ] Strong database password used (16+ characters)
- [ ] JWT secret is strong (64+ characters)
- [ ] MongoDB IP whitelist configured
- [ ] CORS properly configured (only allows your frontend domain)
- [ ] HTTPS enabled on all services (automatic on Render/Railway/Vercel)
- [ ] No sensitive data exposed in frontend code

---

## 📊 Performance Checks

- [ ] Frontend loads in < 3 seconds
- [ ] API responses < 500ms (test with network tab)
- [ ] No console errors in production
- [ ] No memory leaks (open task manager during use)
- [ ] WebSocket connection stable

---

## 📝 Documentation

- [ ] Updated README.md with deployment info
- [ ] Documented environment variables
- [ ] Created admin user credentials (save securely)
- [ ] Noted all deployment URLs

---

## 🎉 Deployment Complete!

### Your Deployment URLs:

**Frontend (Vercel):**  
_________________________________

**Backend (Render/Railway):**  
_________________________________

**Database (MongoDB Atlas):**  
Cluster: _________________________________

---

## 🛠️ Common Issues & Solutions

### "CORS Error"
✅ Verify `CLIENT_URL` in backend matches Vercel URL exactly  
✅ No trailing slash in URLs  
✅ Check browser console for specific error

### "Cannot connect to database"
✅ Check MongoDB connection string format  
✅ Verify username/password are correct  
✅ Ensure IP `0.0.0.0/0` is whitelisted

### "Authentication failed"
✅ Verify JWT_SECRET is set in backend  
✅ Clear browser cookies and localStorage  
✅ Try registering a new account

### "Real-time updates not working"
✅ Check `VITE_SOCKET_URL` in frontend env  
✅ Verify WebSocket connection in Network tab  
✅ Check backend CORS includes WebSocket

### "Backend sleeps/slow to wake"
✅ This is normal on free tiers  
✅ First request after sleep takes ~1 minute  
✅ Upgrade to paid plan for 24/7 uptime

---

## 🔄 Maintenance Tasks

### Weekly:
- [ ] Check deployment logs for errors
- [ ] Monitor MongoDB storage usage
- [ ] Test key features

### Monthly:
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit fix`
- [ ] Review error logs

### Quarterly:
- [ ] Rotate JWT secret (requires user re-login)
- [ ] Review and optimize database queries
- [ ] Check for unused packages

---

**Deployment Date:** _________________________________  
**Deployed By:** _________________________________  
**Version:** _________________________________

---

## 📞 Support Resources

- **Render**: https://docs.render.com
- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com

---

✨ **Congratulations! Your TaskFlow app is now live!** ✨
