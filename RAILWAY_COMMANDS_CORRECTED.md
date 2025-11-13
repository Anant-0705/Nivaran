# 🚀 Corrected Railway Deployment Commands

## Step-by-Step AI Service Deployment

### 1. Navigate to AI Service Directory
```powershell
cd "c:\Users\LENOVO\Desktop\ReactNative\ai-service"
```

### 2. Login to Railway
```powershell
railway login
```

### 3. Initialize Railway Project
```powershell
railway init
```
*This will prompt you to create a new project or link to existing one*

### 4. Deploy the AI Service
```powershell
railway up
```

### 5. Set Environment Variables
```powershell
railway variables set MODEL_PATH=/app/models/best.pt
railway variables set CONF_THRESHOLD=0.6
railway variables set INTERNAL_API_KEY=your_secure_api_key_here
railway variables set PORT=8000
```

### 6. Get Deployment Status and URL
```powershell
railway status
```

## 🌐 Alternative: Railway Dashboard Deployment

If CLI gives issues, use the web dashboard:

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Select `ai-service` as root directory
6. Add environment variables:
   - `MODEL_PATH`: `/app/models/best.pt`
   - `CONF_THRESHOLD`: `0.6` 
   - `INTERNAL_API_KEY`: `generate_secure_key`
   - `PORT`: `8000`

## ✅ Expected Result

After deployment, you'll get:
- **AI Service URL**: `https://your-project-name.railway.app`
- **Health endpoint**: `https://your-project-name.railway.app/health`
- **Verify endpoint**: `https://your-project-name.railway.app/verify`

## 🔗 Next Steps

1. Copy the Railway URL from `railway status`
2. Update your Vercel backend environment variables
3. Deploy backend and frontend to Vercel
4. Test the complete integration