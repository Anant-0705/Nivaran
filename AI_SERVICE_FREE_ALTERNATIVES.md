# 🆓 Free AI Service Deployment Alternatives

Railway requires a paid plan, so let's use free alternatives for your AI service deployment.

## 🥇 **Option 1: Render (Recommended - Free Tier)**

### Deploy to Render (Free for 750 hours/month)

1. **Go to [render.com](https://render.com)**
2. **Sign up/Login** with GitHub
3. **New Web Service** → Connect Repository
4. **Configure:**
   - **Repository**: Select your Nivaran repo
   - **Root Directory**: `ai-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Environment Variables:**
   ```
   MODEL_PATH=/opt/render/project/src/models/best.pt
   CONF_THRESHOLD=0.6
   INTERNAL_API_KEY=your_secure_api_key
   PORT=10000
   ```

6. **Deploy** - Takes ~5-10 minutes

### Render Dockerfile (if needed)
```dockerfile
FROM python:3.10-slim

WORKDIR /opt/render/project/src

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p models

ENV MODEL_PATH=/opt/render/project/src/models/best.pt
ENV CONF_THRESHOLD=0.6
ENV PORT=10000

EXPOSE $PORT

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]
```

## 🥈 **Option 2: Google Cloud Run (Free Tier)**

### Deploy to Google Cloud Run (2 million requests/month free)

1. **Install Google Cloud SDK**
   ```bash
   # Download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Login and Setup**
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   gcloud services enable run.googleapis.com
   ```

3. **Deploy from AI Service Directory**
   ```bash
   cd ai-service
   gcloud run deploy nivaran-ai-service \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="MODEL_PATH=/app/models/best.pt,CONF_THRESHOLD=0.6,INTERNAL_API_KEY=your_key"
   ```

## 🥉 **Option 3: Hugging Face Spaces (Free)**

### Deploy to Hugging Face (Free with community access)

1. **Go to [huggingface.co/spaces](https://huggingface.co/spaces)**
2. **Create New Space**
   - **Name**: `nivaran-ai-service`
   - **Framework**: `Docker`
   - **Visibility**: `Public`

3. **Upload Files:**
   - Upload all files from `ai-service/` directory
   - Ensure `Dockerfile` and `requirements.txt` are present

4. **Environment Variables** (in Space settings):
   ```
   MODEL_PATH=/app/models/best.pt
   CONF_THRESHOLD=0.6
   INTERNAL_API_KEY=your_secure_key
   ```

## 🏃 **Quick Setup: Use Render (Easiest)**

Let me create the Render deployment configuration:

### 1. Create render.yaml
```yaml
services:
  - type: web
    name: nivaran-ai-service
    env: python
    region: oregon
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: MODEL_PATH
        value: /opt/render/project/src/models/best.pt
      - key: CONF_THRESHOLD
        value: "0.6"
      - key: INTERNAL_API_KEY
        generateValue: true
      - key: PORT
        value: "10000"
```

### 2. Deployment Steps
1. Push your code to GitHub
2. Go to [render.com](https://render.com) 
3. "New Web Service"
4. Connect GitHub repo
5. Select `ai-service` as root directory
6. Click "Create Web Service"

**Result**: You'll get a URL like `https://nivaran-ai-service.onrender.com`

## 🔗 **Integration with Vercel Backend**

Once deployed on any platform, update your Vercel backend:

```bash
# Update Vercel environment variables
cd backend
vercel env add AI_SERVICE_URL https://your-ai-service.onrender.com production
vercel env add INTERNAL_API_KEY your_generated_api_key production
```

## 📊 **Platform Comparison**

| Platform | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Render** | 750 hrs/month | Easy setup, good for AI | Sleeps after 15min idle |
| **Google Cloud Run** | 2M requests/month | Auto-scaling, reliable | More complex setup |
| **Hugging Face** | Unlimited | Great for ML models | Community tier limitations |
| **Railway** | ❌ Paid only | Best performance | No free tier |

## ✅ **Recommended: Use Render**

Render is the best choice because:
- ✅ **Free tier**: 750 hours/month
- ✅ **Easy deployment**: Connect GitHub repo
- ✅ **Good for AI**: Handles Python ML workloads well
- ✅ **Auto-deploy**: Updates when you push to GitHub

Would you like me to help you set up the deployment on Render?