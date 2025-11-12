#!/bin/bash

# Production Deployment Script
# This script handles production deployment with zero downtime

set -e  # Exit on any error

# Configuration
PROJECT_DIR="/opt/nivaran"
BACKUP_DIR="/opt/backups/nivaran"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
HEALTH_CHECK_URL="https://api.nivaran.app/health"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Slack notification function
notify_slack() {
    local message="$1"
    local status="$2"  # success, warning, error
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="good"
        if [ "$status" = "warning" ]; then
            color="warning"
        elif [ "$status" = "error" ]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Nivaran Production Deployment\",
                    \"text\": \"$message\",
                    \"footer\": \"$(hostname)\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK" || warn "Failed to send Slack notification"
    fi
}

# Cleanup function for graceful exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        error "Deployment failed with exit code $exit_code"
        notify_slack "❌ Production deployment failed" "error"
    fi
    exit $exit_code
}

trap cleanup EXIT

# Pre-flight checks
preflight_checks() {
    log "Running pre-flight checks..."
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root or with sudo"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check project directory
    if [ ! -d "$PROJECT_DIR" ]; then
        error "Project directory $PROJECT_DIR does not exist"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$PROJECT_DIR/.env.production" ]; then
        error "Environment file .env.production not found"
        exit 1
    fi
    
    # Check disk space (require at least 2GB free)
    local available_space=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then  # 2GB in KB
        error "Insufficient disk space. At least 2GB required"
        exit 1
    fi
    
    log "✓ Pre-flight checks passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup database
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump \
        -U postgres -d nivaran | gzip > "$backup_path/database.sql.gz"
    
    # Backup volumes
    docker run --rm \
        -v nivaran_backend_uploads:/source \
        -v "$backup_path":/backup \
        alpine tar czf /backup/uploads.tar.gz -C /source .
    
    # Backup configuration
    cp "$PROJECT_DIR/.env.production" "$backup_path/"
    cp "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" "$backup_path/"
    
    # Store backup metadata
    echo "Timestamp: $timestamp" > "$backup_path/metadata.txt"
    echo "Git Commit: $(git rev-parse HEAD)" >> "$backup_path/metadata.txt"
    echo "Docker Images:" >> "$backup_path/metadata.txt"
    docker-compose -f "$DOCKER_COMPOSE_FILE" images >> "$backup_path/metadata.txt"
    
    log "✓ Backup created at $backup_path"
}

# Update Docker images
update_images() {
    log "Pulling latest Docker images..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    log "✓ Docker images updated"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    cd "$PROJECT_DIR"
    
    # Load environment variables
    export $(grep -v '^#' .env.production | xargs)
    
    # Deploy with zero downtime
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --remove-orphans
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "healthy"; then
            break
        fi
        
        sleep 10
        ((attempt++))
        log "Waiting for services... (attempt $attempt/$max_attempts)"
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Services failed to become healthy"
        exit 1
    fi
    
    log "✓ Application deployed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_DIR"
    
    # Run migrations
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend npm run migrate
    
    log "✓ Database migrations completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "✓ Health check passed"
            return 0
        fi
        
        sleep 5
        ((attempt++))
        warn "Health check failed, retrying... (attempt $attempt/$max_attempts)"
    done
    
    error "Health check failed after $max_attempts attempts"
    exit 1
}

# Smoke tests
smoke_tests() {
    log "Running smoke tests..."
    
    # Test API endpoints
    local api_base="https://api.nivaran.app"
    
    # Test health endpoint
    if ! curl -f -s "$api_base/health" | grep -q '"status":"healthy"'; then
        error "Health endpoint smoke test failed"
        return 1
    fi
    
    # Test docs endpoint
    if ! curl -f -s -o /dev/null "$api_base/docs"; then
        error "Documentation endpoint smoke test failed"
        return 1
    fi
    
    # Test database connectivity
    if ! curl -f -s "$api_base/health/detailed" | grep -q '"database":"healthy"'; then
        error "Database connectivity smoke test failed"
        return 1
    fi
    
    log "✓ Smoke tests passed"
}

# Cleanup old backups (keep last 10)
cleanup_backups() {
    log "Cleaning up old backups..."
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "backup_*" -type d | \
            sort -r | \
            tail -n +11 | \
            xargs rm -rf
    fi
    
    log "✓ Old backups cleaned up"
}

# Main deployment flow
main() {
    log "Starting production deployment..."
    
    preflight_checks
    create_backup
    update_images
    deploy_app
    run_migrations
    health_check
    smoke_tests
    cleanup_backups
    
    local success_message="🚀 Production deployment completed successfully"
    log "$success_message"
    notify_slack "$success_message" "success"
}

# Script execution
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi