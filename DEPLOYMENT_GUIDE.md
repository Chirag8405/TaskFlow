# 🚀 TaskFlow Deployment Guide

Complete guide to deploy TaskFlow on Render/Railway (Backend), Vercel (Frontend), and MongoDB Atlas (Database).

---

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas account
- [ ] Render/Railway account
- [ ] Vercel account
- [ ] GitHub repository pushed

---

## 1️⃣ MongoDB Atlas Setup

### Step 1: Create Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in or create account
3. Create a **New Project** (e.g., "TaskFlow")
4. Click **"Build a Database"**
5. Choose **FREE** tier (M0 Sandbox)
6. Select a **Cloud Provider & Region** (closest to your users)
7. Click **"Create Cluster"**

### Step 2: Configure Database Access
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Create username and **strong password** (save these!)
4. Set privileges to **"Read and write to any database"**
5. Click **"Add User"**

### Step 3: Configure Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for deployment)
   - IP: `0.0.0.0/0`
4. Click **"Confirm"**

### Step 4: Get Connection String
1. Go to **Database** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your actual credentials
5. Add database name before `?`: 
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
   ```

---

## 2️⃣ Backend Deployment (Choose Render OR Railway)

### Option A: Deploy on Render

#### Step 1: Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub

#### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `taskflow-backend`
   - **Region**: Choose closest region
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

#### Step 3: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**:

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_12345
PORT=5000
CLIENT_URL=https://your-app.vercel.app
```

**Important**: Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://taskflow-backend.onrender.com`

---

### Option B: Deploy on Railway

#### Step 1: Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign in with GitHub

#### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository

#### Step 3: Configure Service
1. Click **"Settings"**
2. Set **Root Directory**: `server`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`

#### Step 4: Add Environment Variables
Go to **"Variables"** tab and add:

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_12345
PORT=5000
CLIENT_URL=https://your-app.vercel.app
```

#### Step 5: Deploy
1. Railway will auto-deploy
2. Click **"Settings"** → **"Networking"** → **"Generate Domain"**
3. Copy your backend URL: `https://taskflow-backend.up.railway.app`

---

## 3️⃣ Frontend Deployment (Vercel)

### Step 1: Update Environment File
Edit `client/.env.production` with your backend URL:

```bash
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_SOCKET_URL=https://your-backend-app.onrender.com

# OR for Railway:
# VITE_API_URL=https://your-backend-app.up.railway.app/api
# VITE_SOCKET_URL=https://your-backend-app.up.railway.app
```

### Step 2: Commit Changes
```bash
git add .
git commit -m "Add production environment configuration"
git push origin main
```

### Step 3: Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 4: Add Environment Variables
In **"Environment Variables"** section:

```bash
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_SOCKET_URL=https://your-backend-app.onrender.com
```

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL: `https://your-app.vercel.app`

### Step 6: Update Backend CLIENT_URL
Go back to Render/Railway and update the `CLIENT_URL` environment variable:

**Render**: Dashboard → Environment → Edit `CLIENT_URL`
```bash
CLIENT_URL=https://your-app.vercel.app
```

**Railway**: Variables → Edit `CLIENT_URL`
```bash
CLIENT_URL=https://your-app.vercel.app
```

Click **"Save"** and wait for automatic redeployment.

---

## 4️⃣ Post-Deployment Steps

### Step 1: Test API Connection
Visit your backend health endpoint:
```
https://your-backend-app.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-10-26T...",
  "environment": "production"
}
```

### Step 2: Test Frontend
1. Visit your frontend URL: `https://your-app.vercel.app`
2. Try to **Register** a new account
3. Try to **Login**
4. Create a **Project**
5. Create a **Task**
6. Test **Real-time updates** (open two browser windows)

### Step 3: Create Admin User (Optional)
SSH into your backend or use MongoDB Atlas data explorer to promote a user to admin.

---

## 🔧 Troubleshooting

### Issue: "Network Error" or "CORS Error"

**Solution**: Check CORS configuration
1. Verify `CLIENT_URL` in backend environment variables
2. Make sure frontend URL matches exactly (no trailing slash)
3. Check browser console for specific CORS error

### Issue: "Cannot connect to database"

**Solution**: Check MongoDB connection
1. Verify `MONGO_URI` is correct
2. Check username/password in connection string
3. Verify IP whitelist includes `0.0.0.0/0` in MongoDB Atlas

### Issue: "Socket connection failed"

**Solution**: Check WebSocket configuration
1. Verify `VITE_SOCKET_URL` matches backend URL
2. Check browser console for socket errors
3. Ensure backend allows WebSocket connections

### Issue: "JWT Authentication Failed"

**Solution**: Check JWT secret
1. Verify `JWT_SECRET` is set in backend
2. Ensure it's at least 32 characters
3. Check token is being sent from frontend

### Issue: Backend "Build Failed" on Render/Railway

**Solution**: Check build logs
1. Ensure `package.json` exists in `server` folder
2. Verify Node version compatibility (use Node 18+)
3. Check for syntax errors in code

---

## 🎉 Success!

Your TaskFlow application is now live! 🚀

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend-app.onrender.com
- **Database**: MongoDB Atlas

---

## 📊 Monitoring & Maintenance

### Render Free Tier Limitations
- Server sleeps after 15 minutes of inactivity
- Cold start takes ~1 minute
- 750 hours/month free (enough for one service)

**Solution**: Upgrade to paid plan ($7/month) for 24/7 uptime

### Railway Free Tier Limitations
- $5 free credit/month
- Auto-sleep after inactivity
- Limited to 500 hours/month

### Vercel Free Tier
- Unlimited bandwidth
- 100 GB-hours/month
- Auto-scaling

### MongoDB Atlas Free Tier
- 512 MB storage
- Shared cluster
- Basic backup

---

## 🔐 Security Best Practices

1. **Never commit** `.env` files to GitHub
2. **Use strong passwords** for database
3. **Rotate JWT secrets** periodically
4. **Enable 2FA** on all platforms
5. **Monitor logs** regularly
6. **Keep dependencies updated**: `npm audit fix`

---

## 📝 Useful Commands

### Check Backend Logs
**Render**: Dashboard → Logs tab
**Railway**: Click service → Logs tab

### Redeploy Backend
**Render**: Dashboard → Manual Deploy → "Clear build cache & deploy"
**Railway**: Automatic on git push

### Redeploy Frontend
**Vercel**: Dashboard → Deployments → "Redeploy"

### Update Environment Variables
After updating env vars, both platforms will auto-redeploy.

---

## 🆘 Need Help?

- Check platform status pages
- Review deployment logs
- Test API endpoints with curl/Postman
- Check MongoDB Atlas metrics
- Review browser console errors

---

**Last Updated**: October 26, 2025
