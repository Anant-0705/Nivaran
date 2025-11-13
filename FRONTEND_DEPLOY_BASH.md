# 🚀 Frontend Deployment - Bash Commands

## Option 1: Install Vercel CLI and Deploy

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Navigate to frontend directory
cd "/c/Users/LENOVO/Desktop/ReactNative/CivicReportApp"

# 3. Login to Vercel (will open browser)
vercel login

# 4. Deploy to production
vercel --prod
```

## Option 2: Use npx (if global install fails)

```bash
# Navigate to frontend directory
cd "/c/Users/LENOVO/Desktop/ReactNative/CivicReportApp"

# Deploy using npx (downloads Vercel CLI temporarily)
npx vercel --prod
```

## Option 3: PowerShell Commands (Alternative)

```powershell
# Switch to PowerShell and run:
cd "c:\Users\LENOVO\Desktop\ReactNative\CivicReportApp"
npm install -g vercel
vercel login
vercel --prod
```

## 📋 Step-by-Step Process

### 1. First, ensure you're in the right directory:
```bash
pwd  # Should show: /c/Users/LENOVO/Desktop/ReactNative/CivicReportApp
ls   # Should show: dist/, package.json, vercel.json, etc.
```

### 2. Install Vercel CLI:
```bash
npm install -g vercel
```

### 3. Login (opens browser):
```bash
vercel login
```

### 4. Deploy:
```bash
vercel --prod
```

## 🔧 If Installation Fails

### Try using npx instead:
```bash
npx vercel login
npx vercel --prod
```

## ✅ Expected Output

After successful deployment, you'll see:
```
✅ Production: https://your-frontend-name.vercel.app [copied to clipboard] [2m]
📝 Inspect: https://vercel.com/your-username/your-frontend-name/...
```

## 🌐 Post-Deployment

After frontend deploys, you'll get a URL like:
- `https://civic-report-app-frontend.vercel.app`
- Or `https://nivaran-frontend.vercel.app`

Use this URL to update your backend environment variables!