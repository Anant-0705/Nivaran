# Nivaran Production Deployment Guide

This comprehensive guide covers the complete deployment process for the Nivaran Civic Reporting platform.

## Overview

Nivaran is a full-stack civic reporting platform with the following architecture:

- **Frontend**: React Native with Expo (Mobile + Web)
- **Backend**: Node.js Express API with comprehensive security
- **Database**: PostgreSQL with Supabase integration
- **AI Service**: Python FastAPI for intelligent features
- **Infrastructure**: Docker containers with Nginx reverse proxy
- **Monitoring**: Prometheus, Grafana, Loki for observability

## Prerequisites

### Server Requirements

- **Minimum**: 4 CPU cores, 8GB RAM, 100GB SSD
- **Recommended**: 8 CPU cores, 16GB RAM, 250GB SSD
- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **Docker**: 24.0+ with Docker Compose v2

### Domain Requirements

- Primary domain: `nivaran.app`
- API subdomain: `api.nivaran.app`
- SSL certificates (Let's Encrypt recommended)

### External Services

- **Supabase**: PostgreSQL database hosting
- **OpenAI**: AI analysis features
- **Cloudinary**: Image storage and optimization
- **SendGrid**: Email notifications
- **AWS S3**: Backup storage (optional)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nivaran.git
cd nivaran
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

### 3. Deploy Production

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
sudo ./scripts/deploy.sh
```

### 4. Verify Deployment

```bash
# Run smoke tests
./scripts/smoke-tests.sh
```

## Detailed Deployment Process

### Step 1: Server Preparation

1. **Update system packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Docker**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **Install Docker Compose**:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Step 2: SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --standalone -d nivaran.app -d www.nivaran.app -d api.nivaran.app

# Copy certificates
sudo cp /etc/letsencrypt/live/nivaran.app/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/nivaran.app/privkey.pem ./nginx/ssl/private.key
```

#### Option B: Custom Certificates

```bash
# Place your certificates
cp your-cert.pem ./nginx/ssl/cert.pem
cp your-private-key.key ./nginx/ssl/private.key
```

### Step 3: Environment Configuration

Edit `.env.production` with your actual values:

```bash
# Required configurations
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_64_char_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key

# Optional but recommended
SLACK_WEBHOOK_URL=your_slack_webhook
SENTRY_DSN=your_sentry_dsn
```

### Step 4: Production Deployment

```bash
# Deploy all services
docker-compose -f docker-compose.production.yml up -d

# Run database migrations
docker-compose -f docker-compose.production.yml exec backend npm run migrate

# Verify health
curl https://api.nivaran.app/health
```

## CI/CD Pipeline Setup

### GitHub Actions Configuration

1. **Add repository secrets**:
   - `PRODUCTION_HOST`: Your server IP
   - `PRODUCTION_USER`: SSH username
   - `PRODUCTION_SSH_KEY`: SSH private key
   - `SLACK_WEBHOOK_URL`: Slack notifications

2. **Configure workflow**:
   The CI/CD pipeline is already configured in `.github/workflows/ci-cd.yml`

3. **Deploy process**:
   - Push to `main` branch triggers production deployment
   - Push to `develop` branch triggers staging deployment
   - Pull requests run tests and security scans

### Manual Deployment

```bash
# Production deployment
./scripts/deploy.sh

# Create backup before deployment
./scripts/backup.sh

# Run smoke tests after deployment
./scripts/smoke-tests.sh
```

## Monitoring and Observability

### Prometheus Metrics

Access Prometheus at: `http://your-server:9090`

Key metrics to monitor:
- HTTP request rates and response times
- Database connection pool status
- Memory and CPU usage
- Error rates by endpoint

### Grafana Dashboards

Access Grafana at: `http://your-server:3003`

Default credentials: `admin` / `your_grafana_password`

Pre-configured dashboards:
- Application overview
- Database performance
- API response times
- Error tracking

### Log Management

Logs are centralized using Loki and accessible via Grafana.

Log locations:
- Backend: `/var/log/backend/`
- Nginx: `/var/log/nginx/`
- Database: Docker container logs

## Backup and Recovery

### Automated Backups

Backups run daily at 2 AM UTC:

```bash
# Manual backup
./scripts/backup.sh

# List available backups
docker-compose -f docker-compose.production.yml exec backend npm run backup:list

# Restore from backup
./scripts/restore.sh backup_20241215_143022.tar.gz
```

### Backup Contents

- PostgreSQL database dump
- Redis data dump
- User uploaded files
- Configuration files
- SSL certificates

### Disaster Recovery

1. **Server failure**: Deploy to new server using backup
2. **Database corruption**: Restore from latest backup
3. **SSL certificate expiry**: Auto-renewal with Certbot
4. **Service failure**: Auto-restart with Docker healthchecks

## Performance Optimization

### Database Optimization

```sql
-- Enable query optimization
ANALYZE;

-- Update statistics
REINDEX DATABASE nivaran;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Nginx Optimization

Key optimizations already implemented:
- Gzip compression
- Static file caching
- Connection pooling
- Rate limiting

### Application Performance

- Connection pooling (20 max connections)
- Redis caching for sessions
- Image optimization via Cloudinary
- CDN integration ready

## Security Checklist

✅ **SSL/TLS Configuration**
- TLS 1.2/1.3 only
- Strong cipher suites
- HSTS headers
- OCSP stapling

✅ **Application Security**
- JWT authentication
- Rate limiting (tiered)
- Input sanitization
- XSS/CSRF protection
- SQL injection prevention

✅ **Infrastructure Security**
- Firewall configuration
- Non-root containers
- Secret management
- Regular security updates

✅ **Monitoring & Alerting**
- Health check endpoints
- Error tracking with Sentry
- Performance monitoring
- Security scanning

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View service logs
docker-compose -f docker-compose.production.yml logs backend

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
```

#### Database Connection Issues

```bash
# Check database health
curl https://api.nivaran.app/health/detailed

# Access database directly
docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d nivaran

# Check connection pool
curl https://api.nivaran.app/health/detailed | jq '.poolInfo'
```

#### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"

# Renew Let's Encrypt certificate
sudo certbot renew

# Test SSL configuration
curl -I https://api.nivaran.app/health
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.nivaran.app/health

# Check database performance
docker-compose -f docker-compose.production.yml exec postgres pg_stat_activity
```

### Log Analysis

```bash
# View recent errors
docker-compose -f docker-compose.production.yml logs --tail=100 backend | grep ERROR

# Monitor real-time logs
docker-compose -f docker-compose.production.yml logs -f backend

# Check Nginx access logs
docker-compose -f docker-compose.production.yml exec nginx tail -f /var/log/nginx/access.log
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Add HAProxy or AWS ALB
2. **Multiple Backend Instances**: Scale backend service
3. **Database Read Replicas**: Implement read/write splitting
4. **Redis Cluster**: Scale session storage

### Vertical Scaling

1. **Increase server resources**: More CPU/RAM
2. **Optimize database settings**: Tune PostgreSQL
3. **Increase connection pools**: Scale database connections
4. **SSD storage**: Faster disk I/O

## Maintenance Tasks

### Daily
- ✅ Check service health
- ✅ Review error logs
- ✅ Monitor performance metrics

### Weekly
- ✅ Review backup integrity
- ✅ Update security patches
- ✅ Analyze performance trends

### Monthly
- ✅ SSL certificate renewal check
- ✅ Database maintenance
- ✅ Security audit
- ✅ Capacity planning review

## Support and Documentation

### Resources
- **API Documentation**: https://api.nivaran.app/docs
- **Health Dashboard**: https://status.nivaran.app (if implemented)
- **Support Email**: support@nivaran.app

### Emergency Contacts
- **On-call Engineer**: [Your contact info]
- **DevOps Team**: [Team contact info]
- **Infrastructure Provider**: [Provider contact info]

## Version History

- **v1.0.0**: Initial production release
- **v1.1.0**: Enhanced security features
- **v1.2.0**: Performance optimizations
- **v1.3.0**: AI service integration

---

## Conclusion

This deployment guide provides comprehensive instructions for deploying and maintaining the Nivaran platform in production. The infrastructure is designed for reliability, security, and scalability.

For additional support or questions, please contact the development team or refer to the detailed documentation in each service directory.