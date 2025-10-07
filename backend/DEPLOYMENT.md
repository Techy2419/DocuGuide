# Backend Deployment Guide

## Quick Deploy to Render

1. **Create a new Web Service on Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service**:
   - **Name**: `docuguide-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is sufficient

3. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will set this automatically)

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://docuguide-backend.onrender.com`)

## Quick Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

3. **Configure**:
   - Follow the prompts
   - Set environment variables in Vercel dashboard

## Quick Deploy to Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**:
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

## Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=production
PORT=3000
OPENROUTER_API_KEY=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
```

## Testing Deployment

After deployment, test the health endpoint:

```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "DocuGuide Form Guide Backend"
}
```

## Update Frontend

After deploying the backend, update the backend URL in `utils/ai-manager.js`:

```javascript
this.backendUrl = 'https://your-deployed-backend-url.com';
```

## Monitoring

- **Render**: Check the dashboard for logs and metrics
- **Vercel**: Use the Vercel dashboard for monitoring
- **Railway**: Use the Railway dashboard for logs

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all dependencies are in `package.json`
2. **Runtime errors**: Check logs for specific error messages
3. **CORS issues**: Ensure CORS is properly configured
4. **API key issues**: Verify the OpenRouter API key is correct

### Logs

Check the deployment platform's logs for detailed error information.

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Enable HTTPS in production
- Consider rate limiting for production use
