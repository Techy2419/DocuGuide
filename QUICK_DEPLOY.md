# 🚀 Quick Backend Deployment Guide

## Option 1: Deploy to Render (Recommended)

### Step 1: Push to GitHub
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit with backend"

# Create GitHub repository and push
# Go to github.com → New Repository → Create
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/DocuGuide.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `docuguide-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Click "Create Web Service"
7. Wait 2-3 minutes for deployment

### Step 3: Get Your Backend URL
After deployment, you'll get a URL like:
`https://docuguide-backend.onrender.com`

### Step 4: Update Frontend
Edit `utils/ai-manager.js` and update:
```javascript
this.backendUrl = 'https://your-actual-url.onrender.com';
```

## Option 2: Deploy to Vercel (Alternative)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd backend
vercel
```

### Step 3: Follow prompts
- Project name: `docuguide-backend`
- Framework: `Other`
- Build command: `npm install`
- Output directory: `.`

## Option 3: Deploy to Railway (Simple)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy
```bash
cd backend
railway login
railway init
railway up
```

## Testing Your Deployment

After deployment, test with:
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T04:41:36.201Z",
  "service": "DocuGuide Form Guide Backend"
}
```

## Troubleshooting

### Common Issues:
1. **Build fails**: Check that all dependencies are in package.json
2. **Runtime errors**: Check logs in Render dashboard
3. **CORS issues**: Already configured in server.js
4. **API key issues**: Verify OpenRouter API key is correct

### Check Logs:
- Render: Go to your service dashboard → Logs
- Vercel: Go to your project dashboard → Functions → Logs
- Railway: Go to your project dashboard → Logs

## Next Steps After Deployment

1. ✅ Backend deployed
2. ✅ Get backend URL
3. ✅ Update frontend with backend URL
4. ✅ Test form guide functionality
5. ✅ Deploy extension to Chrome Web Store
