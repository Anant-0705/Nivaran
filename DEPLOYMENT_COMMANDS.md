# Nivaran Vercel Deployment Commands

Complete deployment guide with exact commands to run.

## 🔑 Pre-deployment Setup

### 1. Install Vercel CLI
```powershell
npm install -g vercel
```

### 2. Login to Vercel
```powershell
vercel login
```

## 🚀 Deploy Backend API

### Navigate to backend and deploy
```powershell
cd "c:\Users\LENOVO\Desktop\ReactNative\backend"
vercel --prod
```

### Set Backend Environment Variables
```powershell
# Required environment variables for backend
vercel env add NODE_ENV production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add SESSION_SECRET production
vercel env add GOOGLE_MAPS_API_KEY production

# AI Service Integration (after Railway deployment)
vercel env add AI_SERVICE_URL production
vercel env add INTERNAL_API_KEY production

# Frontend URL (after frontend deployment)
vercel env add FRONTEND_URL production
```

## 🌐 Deploy Frontend App

### Navigate to frontend and deploy
```powershell
cd "c:\Users\LENOVO\Desktop\ReactNative\CivicReportApp"
vercel --prod
```

### Set Frontend Environment Variables
```powershell
# Required environment variables for frontend
vercel env add EXPO_PUBLIC_API_URL production
vercel env add EXPO_PUBLIC_SUPABASE_URL production
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
vercel env add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID production
vercel env add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY production
```

## 🤖 Deploy AI Service to Render (Free Alternative)

### Install Render CLI (Optional)
```powershell
npm install -g @render/cli
```

### Deploy AI Service to Render (Recommended - Free Tier)
```powershell
# Option 1: Using Render Dashboard (Easiest)
# 1. Go to https://render.com
# 2. Sign up with GitHub
# 3. New Web Service → Connect Repository
# 4. Select 'ai-service' as root directory
# 5. Use these settings:
#    - Environment: Python 3
#    - Build Command: pip install -r requirements.txt
#    - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
# 6. Add Environment Variables:
#    - MODEL_PATH: /opt/render/project/src/models/best.pt
#    - CONF_THRESHOLD: 0.6
#    - INTERNAL_API_KEY: (generate secure key)
# 7. Deploy!

# Option 2: Alternative Platforms
# See AI_SERVICE_FREE_ALTERNATIVES.md for Google Cloud Run and Hugging Face options
```

## 🔗 Update URLs After Deployment

### Update Backend with AI Service URL
```powershell
# After Render deployment, update backend
cd "c:\Users\LENOVO\Desktop\ReactNative\backend"
vercel env add AI_SERVICE_URL https://nivaran-ai-service.onrender.com production
```

### Update Frontend with Backend URL
```powershell
# After backend deployment, update frontend
cd "c:\Users\LENOVO\Desktop\ReactNative\CivicReportApp"
vercel env add EXPO_PUBLIC_API_URL https://your-backend.vercel.app production
```

### Update Mobile App Configuration
```powershell
# After all deployments, update mobile app URLs in code
# Edit: src/screens/ReportIssueScreen.tsx
# Replace local URLs with production Vercel URLs
```

## 📱 Example Production URLs

After deployment, your app will be available at:

- **Frontend**: `https://civicreportapp-frontend.vercel.app`
- **Backend API**: `https://civicreportapp-backend.vercel.app/api`
- **AI Service**: `https://nivaran-ai-service.onrender.com`
- **Health Check**: `https://civicreportapp-backend.vercel.app/api/health`

## ✅ Deployment Checklist

- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel  
- [ ] AI service deployed to Railway
- [ ] All environment variables configured
- [ ] URLs updated in mobile app code
- [ ] Health checks passing
- [ ] Image verification working
- [ ] Mobile app testing complete

Your Nivaran app will be live and production-ready! 🎉