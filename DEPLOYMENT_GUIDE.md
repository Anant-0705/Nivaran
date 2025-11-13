# Nivaran Deployment Guide - Complete Step-by-Step Instructions

## 🚀 Quick Start - 30 Minute Deployment

Follow these steps to deploy your Nivaran Civic Reporting App to production in under 30 minutes.

### Prerequisites Checklist
- [ ] Server with minimum 4GB RAM, 2 CPU cores
- [ ] Domain name purchased and DNS configured
- [ ] Basic Linux command knowledge
- [ ] SSH access to your server

---

## 📋 Step-by-Step Deployment Process

### Step 1: Server Setup (5 minutes)

#### 1.1 Connect to Your Server
```bash
# Replace with your actual server IP and user
ssh user@your-server-ip

# If using a key file (AWS, DigitalOcean, etc.)
ssh -i your-key.pem user@your-server-ip
```

#### 1.2 Update System and Install Docker
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install essential tools
sudo apt install -y git curl nginx certbot
```

#### 1.3 Clone Repository
```bash
# Clone your Nivaran repository
git clone https://github.com/Anant-0705/Nivaran.git
cd Nivaran

# Make sure you're in the right directory
pwd
# Should show: /home/user/Nivaran
```

### Step 2: Configure Environment Variables (10 minutes)

#### 2.1 Create Backend Production Environment
```bash
# Create production environment for backend
cat > backend/.env.production << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# Replace these URLs with your actual domain
FRONTEND_URL=https://your-domain.com
ADMIN_PANEL_URL=https://admin.your-domain.com

# AI Service Configuration (Docker internal network)
AI_SERVICE_URL=http://ai-service:8000/verify

# Your existing Supabase configuration
SUPABASE_URL=https://hgxfyfbrwtozynuyqccr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneGZ5ZmJyd3RvenludXlxY2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDU2MjQsImV4cCI6MjA3MjMyMTYyNH0.vMaEiGcM2XNiv1fIGBsl7B3kyEdarsEvyuXXRyK1UsM
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Generate secure keys (will be replaced below)
JWT_SECRET=temp_key_will_be_replaced
ENCRYPTION_KEY=temp_key_will_be_replaced
SESSION_SECRET=temp_key_will_be_replaced
INTERNAL_API_KEY=temp_key_will_be_replaced

# Your existing API keys
GOOGLE_MAPS_API_KEY=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao

# Rate limiting and cache
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REDIS_URL=redis://redis:6379
EOF
```

#### 2.2 Generate Secure Keys
```bash
# Generate and replace secure keys
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 24)
SESSION_SECRET=$(openssl rand -base64 48)
INTERNAL_API_KEY=$(openssl rand -base64 16)

# Replace in environment file
sed -i "s/JWT_SECRET=temp_key_will_be_replaced/JWT_SECRET=$JWT_SECRET/" backend/.env.production
sed -i "s/ENCRYPTION_KEY=temp_key_will_be_replaced/ENCRYPTION_KEY=$ENCRYPTION_KEY/" backend/.env.production
sed -i "s/SESSION_SECRET=temp_key_will_be_replaced/SESSION_SECRET=$SESSION_SECRET/" backend/.env.production
sed -i "s/INTERNAL_API_KEY=temp_key_will_be_replaced/INTERNAL_API_KEY=$INTERNAL_API_KEY/" backend/.env.production

echo "✅ Secure keys generated and configured"
```

#### 2.3 Configure Frontend Environment
```bash
# Create production environment for frontend
cat > CivicReportApp/.env.production << 'EOF'
# Replace with your actual API domain
EXPO_PUBLIC_API_URL=https://api.your-domain.com/api

# Supabase configuration (same as backend)
EXPO_PUBLIC_SUPABASE_URL=https://hgxfyfbrwtozynuyqccr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneGZ5ZmJyd3RvenludXlxY2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDU2MjQsImV4cCI6MjA3MjMyMTYyNH0.vMaEiGcM2XNiv1fIGBsl7B3kyEdarsEvyuXXRyK1UsM

# OAuth and Maps
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=803143910762-p59ajsh9745ahdslkulhf5mphtphsprd.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao
EOF
```

#### 2.4 Update Domain Names
```bash
# Replace placeholder domains with your actual domain
read -p "Enter your domain name (e.g., myapp.com): " DOMAIN_NAME

# Update backend environment
sed -i "s/your-domain.com/$DOMAIN_NAME/g" backend/.env.production

# Update frontend environment
sed -i "s/your-domain.com/$DOMAIN_NAME/g" CivicReportApp/.env.production

echo "✅ Domain configuration updated to: $DOMAIN_NAME"
```

### Step 3: SSL Certificate Setup (5 minutes)

#### 3.1 Create SSL Directory
```bash
# Create SSL certificate directory
mkdir -p ssl
```

#### 3.2 Generate SSL Certificate

**Option A: Let's Encrypt (Free, Recommended for production)**
```bash
# Stop any running web servers
sudo systemctl stop nginx 2>/dev/null || true

# Generate certificate
sudo certbot certonly --standalone \
  -d $DOMAIN_NAME \
  -d api.$DOMAIN_NAME \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive \
  --force-renewal

# Copy certificates to project
sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem ssl/
sudo chown $USER:$USER ssl/*

echo "✅ SSL certificate generated with Let's Encrypt"
```

**Option B: Self-Signed (For testing only)**
```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN_NAME"

echo "✅ Self-signed SSL certificate generated"
```

### Step 4: Configure Nginx (3 minutes)

#### 4.1 Create Nginx Configuration
```bash
# Create nginx configuration
cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    upstream backend {
        server backend:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $DOMAIN_NAME api.$DOMAIN_NAME;
        return 301 https://\$host\$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN_NAME api.$DOMAIN_NAME;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_timeout 60s;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
        }

        # Default response for root
        location / {
            return 200 'Nivaran API is running';
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo "✅ Nginx configuration created"
```

### Step 5: Create Production Docker Compose (2 minutes)

```bash
# Create production docker-compose file
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  ai-service:
    build: 
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: nivaran-ai-service
    restart: unless-stopped
    environment:
      - MODEL_PATH=/app/models/best.pt
      - CONF_THRESHOLD=0.6
    volumes:
      - ./ai-service/models:/app/models:ro
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - nivaran-network

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: nivaran-backend
    restart: unless-stopped
    env_file:
      - ./backend/.env.production
    depends_on:
      ai-service:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - nivaran-network

  nginx:
    image: nginx:alpine
    container_name: nivaran-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - nivaran-network

  redis:
    image: redis:7-alpine
    container_name: nivaran-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - nivaran-network

volumes:
  redis-data:
    driver: local

networks:
  nivaran-network:
    driver: bridge
EOF

echo "✅ Production Docker Compose configuration created"
```

### Step 6: Build and Deploy (10 minutes)

#### 6.1 Build Services
```bash
# Create logs directory
mkdir -p logs/nginx

# Build all services (this may take a few minutes)
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.production.yml build --no-cache

echo "✅ Docker images built successfully"
```

#### 6.2 Start Services
```bash
# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.production.yml up -d

# Wait a moment for services to start
sleep 30

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps
```

#### 6.3 Verify Health
```bash
echo "🔍 Checking service health..."

# Check AI service
echo -n "AI Service: "
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

# Check backend through nginx
echo -n "Backend API: "
if curl -s -k https://localhost/health > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi

# Show logs if there are issues
echo -e "\n📋 Recent logs:"
docker-compose -f docker-compose.production.yml logs --tail=5 --since=1m
```

### Step 7: Configure Domain DNS (2 minutes)

```bash
# Get your server's public IP
SERVER_IP=$(curl -s ifconfig.me)
echo "📍 Your server IP: $SERVER_IP"

echo "🌐 Configure these DNS records in your domain provider:"
echo "   A record: $DOMAIN_NAME → $SERVER_IP"
echo "   A record: api.$DOMAIN_NAME → $SERVER_IP"
echo "   A record: www.$DOMAIN_NAME → $SERVER_IP"

echo -e "\n⏳ Wait for DNS propagation (usually 5-15 minutes)"
echo "   You can check with: nslookup $DOMAIN_NAME"
```

### Step 8: Final Testing (3 minutes)

#### 8.1 Test Local Endpoints
```bash
echo "🧪 Testing local endpoints..."

# Test AI service directly
curl -s http://localhost:8000/health | jq '.' || echo "AI service not responding"

# Test backend through nginx
curl -s -k https://localhost/health | jq '.' || echo "Backend not responding"

# Test rate limiting
echo "Testing rate limiting..."
for i in {1..5}; do
    curl -s -k https://localhost/api/health | head -1
    sleep 1
done
```

#### 8.2 Test External Access (after DNS propagation)
```bash
echo "🌍 Testing external access..."
echo "Once DNS has propagated, test these URLs:"
echo "   https://$DOMAIN_NAME/health"
echo "   https://api.$DOMAIN_NAME/health"
echo "   https://api.$DOMAIN_NAME/api/health"
```

---

## 📱 Update Mobile App Configuration

After deployment, update your mobile app to use the production API:

```bash
# In your mobile app development environment:
# Update CivicReportApp/src/screens/ReportIssueScreen.tsx
# Change the API URL from:
# 'http://192.168.10.146:1200/api/ai/verify'
# To:
# 'https://api.$DOMAIN_NAME/api/ai/verify'
```

---

## 🔧 Post-Deployment Tasks

### Set Up Monitoring (Optional)
```bash
# Add monitoring to docker-compose.production.yml
cat >> docker-compose.production.yml << 'EOF'

  prometheus:
    image: prom/prometheus:latest
    container_name: nivaran-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    networks:
      - nivaran-network

  grafana:
    image: grafana/grafana:latest
    container_name: nivaran-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - nivaran-network
EOF

# Create prometheus config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:8000']
EOF

# Restart to add monitoring
docker-compose -f docker-compose.production.yml up -d prometheus grafana
```

### Set Up Automated Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Backup Redis data
docker-compose -f docker-compose.production.yml exec -T redis redis-cli BGSAVE
docker cp nivaran-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup logs and config
tar -czf $BACKUP_DIR/config_$DATE.tar.gz ssl/ backend/.env.production logs/ nginx.conf

# Keep only last 7 backups
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup.sh") | crontab -
```

### Configure Firewall
```bash
# Configure UFW firewall
sudo ufw --force enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw status
```

---

## 🆘 Troubleshooting

### If Services Won't Start
```bash
# Check logs for errors
docker-compose -f docker-compose.production.yml logs

# Check individual service logs
docker-compose -f docker-compose.production.yml logs ai-service
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs nginx

# Check system resources
df -h      # Disk space
free -h    # Memory
docker system df  # Docker space usage
```

### If API is Not Accessible
```bash
# Check nginx is running
docker-compose -f docker-compose.production.yml ps nginx

# Check nginx logs
docker-compose -f docker-compose.production.yml logs nginx

# Test internal connectivity
docker-compose -f docker-compose.production.yml exec nginx curl http://backend:3000/health

# Check SSL certificates
openssl x509 -in ssl/fullchain.pem -text -noout | grep "Not After"
```

### If Database Connection Fails
```bash
# Check backend logs for database errors
docker-compose -f docker-compose.production.yml logs backend | grep -i "database\|supabase\|error"

# Test Supabase connection manually
curl -H "apikey: your_supabase_anon_key" https://hgxfyfbrwtozynuyqccr.supabase.co/rest/v1/
```

---

## ✅ Deployment Success Checklist

- [ ] All services are running (`docker-compose ps` shows "Up")
- [ ] Health endpoints respond (`curl https://your-domain.com/health`)
- [ ] SSL certificate is valid (no browser warnings)
- [ ] DNS records are configured and propagated
- [ ] Mobile app can connect to production API
- [ ] Rate limiting is working
- [ ] Logs are being generated
- [ ] Firewall is configured
- [ ] Backups are scheduled

---

**🎉 Congratulations!**

Your Nivaran Civic Reporting App is now deployed to production! 

- **Frontend API**: https://api.your-domain.com/api
- **Health Check**: https://your-domain.com/health
- **Monitoring** (if enabled): http://your-domain.com:3001

Remember to update your mobile app's API configuration to point to the new production URL.