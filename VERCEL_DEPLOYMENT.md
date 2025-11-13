# Nivaran Vercel Deployment Guide

Deploy your Nivaran Civic Reporting App to Vercel for production-level hosting with serverless architecture.

## 🚀 Vercel Deployment Overview

Vercel is perfect for:
- ✅ **Frontend**: React Native web builds
- ✅ **Backend API**: Node.js serverless functions
- ❌ **AI Service**: Requires separate hosting (Railway, Render, or AWS)

## 📋 Architecture for Vercel

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Service    │
│   (Vercel)      │◄──►│   (Vercel)      │◄──►│   (Railway)     │
│   Web App       │    │   Serverless    │    │   Python API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │   Database      │
                       │   (Supabase)    │
                       └─────────────────┘
```

---

## Step 1: Prepare Backend for Vercel Serverless

### 1.1 Create Vercel Configuration

```bash
# Create vercel.json in the root directory
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "backend/src/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "CivicReportApp/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "CivicReportApp/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
EOF
```

### 1.2 Modify Backend for Serverless

Create `backend/api/index.js` for Vercel:

```bash
# Create API directory
mkdir -p backend/api

# Create serverless entry point
cat > backend/api/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import your existing app configuration
const app = express();

// CORS configuration for Vercel
app.use(cors({
  origin: [
    'http://localhost:19006',
    'https://your-frontend-domain.vercel.app',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

// Import your existing routes
const healthRoutes = require('../src/routes/health');
const authRoutes = require('../src/routes/auth');
const issueRoutes = require('../src/routes/issues');
const userRoutes = require('../src/routes/users');
// Note: AI routes will point to external AI service

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);

// AI Service Proxy (to external service)
app.use('/api/ai', async (req, res) => {
  try {
    const response = await fetch(process.env.AI_SERVICE_URL + req.path, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'],
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Export for Vercel
module.exports = app;
EOF
```

### 1.3 Update Package.json for Vercel

```bash
# Add Vercel build scripts to backend package.json
cd backend
npm install --save vercel @vercel/node

# Update package.json scripts
cat > package.json << 'EOF'
{
  "name": "civicreportapp-backend",
  "version": "1.0.0",
  "description": "Nivaran Backend API for Vercel",
  "main": "api/index.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "vercel-build": "echo 'Build complete'",
    "test": "jest",
    "migrate": "node database/migrate.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-slow-down": "^2.1.0",
    "express-validator": "^7.3.0",
    "multer": "^1.4.5",
    "form-data": "^4.0.0",
    "axios": "^1.11.1",
    "@supabase/supabase-js": "^2.39.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.10",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF

cd ..
```

---

## Step 2: Deploy AI Service to Railway (External)

Since Vercel doesn't support Python containers, we'll deploy the AI service to Railway:

### 2.1 Prepare AI Service for Railway

```bash
# Create railway.json in ai-service directory
cat > ai-service/railway.json << 'EOF'
{
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
EOF

# Update Dockerfile for Railway
cat > ai-service/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Create models directory
RUN mkdir -p /app/models

# Environment variables
ENV MODEL_PATH=/app/models/best.pt
ENV CONF_THRESHOLD=0.6
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# Add authentication to AI service
cat >> ai-service/main.py << 'EOF'

# Add authentication middleware
@app.middleware("http")
async def authenticate_requests(request: Request, call_next):
    # Skip health checks
    if request.url.path in ["/health", "/ready", "/live"]:
        response = await call_next(request)
        return response
    
    # Check for API key
    api_key = request.headers.get("Authorization")
    if not api_key or not api_key.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")
    
    token = api_key.split(" ")[1]
    expected_key = os.environ.get("INTERNAL_API_KEY", "")
    
    if token != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    response = await call_next(request)
    return response
EOF
```

### 2.2 Deploy AI Service to Railway

```bash
# Install Railway CLI (if not installed)
# npm install -g @railway/cli

# Login to Railway
railway login

# Deploy AI service
cd ai-service
railway link  # Link to your Railway project
railway up    # Deploy

# Get the deployment URL
railway domain  # This will be your AI_SERVICE_URL

cd ..
```

---

## Step 3: Prepare Frontend for Vercel

### 3.1 Build Frontend for Web

```bash
cd CivicReportApp

# Install dependencies
npm install

# Create production build
npx expo export --platform web

# The build will be in the 'dist' directory
ls dist/

cd ..
```

### 3.2 Create Frontend Vercel Config

```bash
# Create frontend-specific vercel.json
cat > CivicReportApp/vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
EOF
```

---

## Step 4: Environment Variables for Vercel

### 4.1 Create Environment Configuration

Create `.env.production` in the root:

```bash
cat > .env.production << 'EOF'
# Backend API Configuration
NODE_ENV=production
PORT=3000

# Database (Supabase)
SUPABASE_URL=https://hgxfyfbrwtozynuyqccr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneGZ5ZmJyd3RvenludXlxY2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDU2MjQsImV4cCI6MjA3MjMyMTYyNH0.vMaEiGcM2XNiv1fIGBsl7B3kyEdarsEvyuXXRyK1UsM
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# AI Service (Railway URL)
AI_SERVICE_URL=https://your-ai-service.railway.app
INTERNAL_API_KEY=your_generated_api_key

# Security Keys
JWT_SECRET=your_jwt_secret_32_chars_minimum
ENCRYPTION_KEY=your_encryption_key_32_chars
SESSION_SECRET=your_session_secret_64_chars

# Frontend URLs
FRONTEND_URL=https://your-frontend.vercel.app

# API Keys
GOOGLE_MAPS_API_KEY=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao
EOF

# Generate secure keys
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.production
echo "ENCRYPTION_KEY=$(openssl rand -base64 24)" >> .env.production
echo "SESSION_SECRET=$(openssl rand -base64 48)" >> .env.production
echo "INTERNAL_API_KEY=$(openssl rand -base64 16)" >> .env.production
```

---

## Step 5: Deploy to Vercel

### 5.1 Install Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### 5.2 Deploy Backend

```bash
# Deploy backend API
cd backend
vercel --prod

# Set environment variables in Vercel dashboard or CLI
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add AI_SERVICE_URL production
vercel env add INTERNAL_API_KEY production
vercel env add JWT_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add SESSION_SECRET production
vercel env add GOOGLE_MAPS_API_KEY production

cd ..
```

### 5.3 Deploy Frontend

```bash
# Deploy frontend
cd CivicReportApp
vercel --prod

# Set frontend environment variables
vercel env add EXPO_PUBLIC_API_URL production
vercel env add EXPO_PUBLIC_SUPABASE_URL production
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
vercel env add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID production
vercel env add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY production

cd ..
```

---

## Step 6: Configure Domain and SSL

### 6.1 Add Custom Domain (Optional)

```bash
# Add custom domain to your Vercel projects
vercel domains add your-api-domain.com --scope backend
vercel domains add your-app-domain.com --scope frontend

# Or use Vercel's provided URLs:
# Backend: https://your-backend.vercel.app
# Frontend: https://your-frontend.vercel.app
```

### 6.2 Update Mobile App Configuration

Update your mobile app's API URL:

```bash
# In ReportIssueScreen.tsx, update the fetch URL:
# From: 'http://192.168.10.146:1200/api/ai/verify'
# To: 'https://your-backend.vercel.app/api/ai/verify'
```

---

## Step 7: Test Deployment

### 7.1 Test Backend API

```bash
# Test health endpoint
curl https://your-backend.vercel.app/api/health

# Test AI proxy
curl -X POST https://your-backend.vercel.app/api/ai/verify \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 7.2 Test Frontend

```bash
# Visit your frontend URL
# https://your-frontend.vercel.app

# Check console for any API connection errors
```

---

## 📊 Vercel Deployment Benefits

### ✅ Advantages
- **Zero server management**: Fully serverless
- **Automatic scaling**: Handles traffic spikes
- **Global CDN**: Fast worldwide delivery
- **Free SSL**: Automatic HTTPS
- **Git integration**: Auto-deploy on push
- **Environment variables**: Secure config management

### ⚠️ Limitations
- **Function timeout**: 10 seconds (Hobby), 60 seconds (Pro)
- **Cold starts**: Slight delay on first request
- **No persistent storage**: Use external services
- **Memory limit**: 1GB max
- **No WebSockets**: Use external service if needed

---

## 🔧 Advanced Configuration

### Function Optimization

```bash
# Create vercel.json with function config
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "backend/api/index.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/api/index.js"
    }
  ],
  "functions": {
    "backend/api/index.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
EOF
```

### Monitoring Setup

```bash
# Add Vercel Analytics (optional)
cd CivicReportApp
npm install @vercel/analytics

# Add to your main component
echo "import { Analytics } from '@vercel/analytics/react';" >> src/App.js
```

---

## 🆘 Troubleshooting Vercel Deployment

### Common Issues

#### 1. Function Timeout
```bash
# Check function logs
vercel logs

# Optimize slow operations
# - Use database connection pooling
# - Implement caching
# - Optimize AI service calls
```

#### 2. Environment Variables
```bash
# List environment variables
vercel env ls

# Update environment variable
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
```

#### 3. Build Errors
```bash
# Check build logs
vercel logs --follow

# Clear Vercel cache
vercel --debug
```

#### 4. CORS Issues
```bash
# Update CORS configuration in backend/api/index.js
# Add your Vercel frontend URL to allowed origins
```

---

## ✅ Vercel Deployment Checklist

### Pre-deployment
- [ ] AI service deployed to Railway/Render
- [ ] Backend modified for serverless
- [ ] Frontend built for web
- [ ] Environment variables configured
- [ ] Domain names ready (optional)

### Deployment
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Custom domains configured
- [ ] SSL certificates active

### Post-deployment
- [ ] API endpoints responding
- [ ] Frontend loads correctly
- [ ] Mobile app updated with new URLs
- [ ] AI service connectivity verified
- [ ] Database connections working
- [ ] Monitoring configured

---

## 🚀 Production URLs

After deployment, your URLs will be:

```
Backend API: https://your-backend.vercel.app/api
Frontend: https://your-frontend.vercel.app
AI Service: https://your-ai-service.railway.app
Health Check: https://your-backend.vercel.app/api/health
```

Your Nivaran app is now deployed on Vercel with production-level reliability and scaling! 🎉

---

## 💰 Cost Considerations

- **Vercel Hobby**: Free tier (good for testing)
- **Vercel Pro**: $20/month (recommended for production)
- **Railway**: $5/month for AI service
- **Supabase**: Free tier or $25/month for production

**Total estimated cost**: $25-45/month for production deployment.