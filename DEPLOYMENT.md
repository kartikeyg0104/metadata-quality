# Deployment Guide

## Backend Deployment (Render)

### Option 1: Deploy using render.yaml (Recommended)
1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file
6. Click "Apply" to deploy

### Option 2: Manual Setup
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: metadata-quality-backend
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Environment Variables (Set in Render Dashboard)
After deployment, add these environment variables in Render:
- `CORS_ORIGIN`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
- `NODE_ENV`: production
- `PORT`: 3000 (automatically set by Render)

### Get Your Backend URL
After deployment, Render will provide a URL like:
`https://metadata-quality-backend.onrender.com`

**Important**: Free tier services on Render may spin down after inactivity. The first request after inactivity may take 30-60 seconds.

---

## Frontend Deployment (Vercel)

### Deploy Steps
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### Environment Variables (Set in Vercel Dashboard)
Go to Project Settings → Environment Variables and add:
- **Variable Name**: `VITE_API_URL`
- **Value**: Your Render backend URL (e.g., `https://metadata-quality-backend.onrender.com`)
- **Environments**: Production, Preview, Development (check all)

### Trigger Redeploy
After adding environment variables:
1. Go to "Deployments" tab
2. Click "..." on the latest deployment
3. Click "Redeploy"

### Get Your Frontend URL
Vercel will provide a URL like:
`https://your-app.vercel.app`

---

## Post-Deployment Steps

### 1. Update Backend CORS
In Render Dashboard, add the `CORS_ORIGIN` environment variable:
```
CORS_ORIGIN=https://your-app.vercel.app
```
Then trigger a redeploy or the service will automatically restart.

### 2. Test the Connection
1. Visit your Vercel frontend URL
2. Try evaluating sample metadata
3. Check browser console for any CORS or API errors

### 3. Create Local .env Files (Optional)
For local development:

**backend/.env**:
```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env**:
```
VITE_API_URL=http://localhost:3000
```

---

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in Render matches your exact Vercel URL (no trailing slash)
- Redeploy backend after changing environment variables

### API Connection Failed
- Check that `VITE_API_URL` is set correctly in Vercel
- Verify backend is running (visit the health endpoint: `https://your-backend.onrender.com/health`)
- Check browser console for the exact error

### Render Service Sleeping
- Free tier services sleep after 15 minutes of inactivity
- First request will take 30-60 seconds to wake up
- Consider upgrading to paid plan for production use

### Build Failures
- Check build logs in Render/Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

---

## Monitoring

### Check Backend Health
Visit: `https://your-backend.onrender.com/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T...",
  "uptime": 123.45
}
```

### Check API Endpoints
Visit: `https://your-backend.onrender.com/`

Returns API documentation and available endpoints.

---

## Updating Your Apps

### Backend Updates
1. Push changes to GitHub
2. Render automatically rebuilds and redeploys

### Frontend Updates
1. Push changes to GitHub
2. Vercel automatically rebuilds and redeploys

Both platforms support automatic deployments from GitHub!
