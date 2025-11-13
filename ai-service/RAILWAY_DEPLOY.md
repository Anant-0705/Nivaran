# Nivaran AI Service Deployment Instructions

Deploy the AI service to Railway for production-ready hosting with authentication.

## 🚀 Quick Deployment to Railway

### Option 1: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to AI service directory
cd ai-service

# Initialize Railway project
railway init

# Deploy the service
railway up

# Set environment variables
railway variables set MODEL_PATH=/app/models/best.pt
railway variables set CONF_THRESHOLD=0.6
railway variables set INTERNAL_API_KEY=$(openssl rand -base64 16)

# Get the deployment URL
railway status
```

### Option 2: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Select the `ai-service` folder as root directory
5. Set environment variables:
   - `MODEL_PATH`: `/app/models/best.pt`
   - `CONF_THRESHOLD`: `0.6`
   - `INTERNAL_API_KEY`: Generate a secure key
6. Deploy!

## 🔑 Environment Variables Required

```bash
MODEL_PATH=/app/models/best.pt
CONF_THRESHOLD=0.6
INTERNAL_API_KEY=your_secure_api_key_here
PORT=8000
```

## 📋 Alternative Platforms

### Render
- Deploy time: ~5-10 minutes
- Cost: $7/month for basic plan
- Good performance for AI workloads

### Google Cloud Run
- Pay per request
- Scales to zero when not in use
- Good for variable traffic

### AWS Fargate
- Enterprise-grade scaling
- Higher complexity setup
- More expensive but very reliable

## 🔗 Integration with Vercel Backend

Once deployed, update your Vercel environment variables:

```bash
# In your Vercel backend settings
AI_SERVICE_URL=https://your-ai-service.railway.app
INTERNAL_API_KEY=your_secure_api_key_here
```

Your AI service will be available at: `https://your-ai-service.railway.app/verify`