npx plugins add vercel/vercel-plugin
# Game Collector - Deployment Guide (Vercel + Render)

Your Game Collector app is now ready for free deployment using **Vercel** (frontend) + **Render** (backend)! 🚀

## Architecture

```
[Vercel - Free]                    [Render - Free]
React Frontend  ──── API calls ───→  Express + SQLite Backend
(Fast global CDN)                   (API server)
```

## What Was Changed

1. **API URLs**: Now use `VITE_API_URL` environment variable for flexible deployment
2. **Vite Proxy**: Added dev proxy so `/api` routes work during local development
3. **Express Server**: Removed static file serving (Vercel handles frontend)
4. **CORS**: Updated to allow Vercel domain
5. **Vercel Config**: Added `vercel.json` for SPA routing
6. **Render Config**: Updated `render.yaml` for backend-only deployment

## Deployment Steps

### Step 1: Deploy Backend to Render

1. **Push your code to GitHub**

2. **Go to [render.com](https://render.com)** and sign up/login

3. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repo
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`

4. **Add Environment Variables**:
   - `NODE_ENV` = `production`

5. **Deploy and note your URL** (e.g., `https://game-collector-api.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up/login

2. **Import Project**:
   - Click "New Project"
   - Connect your GitHub repo
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as `.` (or `game-collector` if in subfolder)

3. **Add Environment Variables**:
   - `VITE_API_URL` = `https://your-render-url.onrender.com/api`
   - (Replace with your actual Render URL from Step 1)

4. **Deploy!**

### Step 3: Update CORS (Important!)

After deploying to Vercel, update the CORS configuration in `server/index.js`:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-app.vercel.app'] // Replace with your actual Vercel domain
    : ['http://localhost:5173', 'http://localhost:3000']
}));
```

Then redeploy your backend on Render.

## Local Development

Your local development setup remains the same:
```bash
npm run dev
```

This starts both the React dev server (port 5173) and Express API server (port 3001).

## Environment Variables Summary

| Service | Variable | Value | Purpose |
|---------|----------|-------|---------|
| **Vercel** | `VITE_API_URL` | `https://your-api.onrender.com/api` | Points frontend to backend |
| **Render** | `NODE_ENV` | `production` | Enables production mode |

## Important Notes

⚠️ **Database Persistence**: Your SQLite database will reset on every deploy/restart on Render's free tier. For persistent data, consider:
- Upgrading to Render's paid tier (persistent disk)
- Using Render's free PostgreSQL database

🕐 **Cold Starts**: Render's free tier sleeps after 15 minutes of inactivity (~30s wake-up time)

✅ **Vercel Benefits**: Your frontend will be blazing fast with global CDN, no cold starts!

## Alternative Options

- **Single Service on Render**: Simpler but slower frontend
- **Railway**: $5 free credit/month
- **Fly.io**: Good for SQLite with persistent volumes

Your app is now deployment-ready with the best free hosting combo! 🎉
