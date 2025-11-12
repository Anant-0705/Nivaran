#!/bin/bash

# Backup Script for Nivaran Production
# Creates comprehensive backups of database, uploads, and configuration

set -e

# Configuration
PROJECT_DIR="/opt/nivaran"
BACKUP_DIR="/opt/backups/nivaran"
RETENTION_DAYS=30
S3_BUCKET="nivaran-backups"  # Optional: for S3 backup
DOCKER_COMPOSE_FILE="docker-compose.production.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: $BACKUP_PATH"
    mkdir -p "$BACKUP_PATH"
}

# Backup PostgreSQL database
backup_database() {
    log "Backing up PostgreSQL database..."
    
    cd "$PROJECT_DIR"
    
    # Create database dump
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump \
        -U postgres \
        -d nivaran \
        --no-password \
        --clean \
        --if-exists \
        --create \
        --verbose | gzip > "$BACKUP_PATH/database.sql.gz"
    
    # Verify backup
    if [ ! -f "$BACKUP_PATH/database.sql.gz" ] || [ ! -s "$BACKUP_PATH/database.sql.gz" ]; then
        error "Database backup failed or is empty"
        exit 1
    fi
    
    local db_size=$(stat -f%z "$BACKUP_PATH/database.sql.gz" 2>/dev/null || stat -c%s "$BACKUP_PATH/database.sql.gz" 2>/dev/null)
    log "✓ Database backup completed (${db_size} bytes)"
}

# Backup Redis data
backup_redis() {
    log "Backing up Redis data..."
    
    cd "$PROJECT_DIR"
    
    # Create Redis backup
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli BGSAVE
    
    # Wait for backup to complete
    sleep 5
    
    # Copy Redis dump
    docker cp "$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)":/data/dump.rdb "$BACKUP_PATH/redis.rdb"
    
    if [ -f "$BACKUP_PATH/redis.rdb" ]; then
        log "✓ Redis backup completed"
    else
        warn "Redis backup may have failed"
    fi
}

# Backup uploaded files
backup_uploads() {
    log "Backing up uploaded files..."
    
    # Backup uploads volume
    docker run --rm \
        -v nivaran_backend_uploads:/source:ro \
        -v "$BACKUP_PATH":/backup \
        alpine tar czf /backup/uploads.tar.gz -C /source . 2>/dev/null || true
    
    if [ -f "$BACKUP_PATH/uploads.tar.gz" ]; then
        local uploads_size=$(stat -f%z "$BACKUP_PATH/uploads.tar.gz" 2>/dev/null || stat -c%s "$BACKUP_PATH/uploads.tar.gz" 2>/dev/null)
        log "✓ Uploads backup completed (${uploads_size} bytes)"
    else
        warn "No uploads found or backup failed"
        touch "$BACKUP_PATH/uploads.tar.gz"
    fi
}

# Backup configuration files
backup_configuration() {
    log "Backing up configuration..."
    
    # Copy environment files
    [ -f "$PROJECT_DIR/.env.production" ] && cp "$PROJECT_DIR/.env.production" "$BACKUP_PATH/"
    [ -f "$PROJECT_DIR/.env" ] && cp "$PROJECT_DIR/.env" "$BACKUP_PATH/"
    
    # Copy Docker Compose files
    cp "$PROJECT_DIR"/docker-compose*.yml "$BACKUP_PATH/" 2>/dev/null || true
    
    # Copy nginx configuration
    if [ -d "$PROJECT_DIR/nginx" ]; then
        tar czf "$BACKUP_PATH/nginx-config.tar.gz" -C "$PROJECT_DIR" nginx/ 2>/dev/null || true
    fi
    
    # Copy SSL certificates
    if [ -d "$PROJECT_DIR/ssl" ]; then
        tar czf "$BACKUP_PATH/ssl-certs.tar.gz" -C "$PROJECT_DIR" ssl/ 2>/dev/null || true
    fi
    
    log "✓ Configuration backup completed"
}

# Create backup metadata
create_metadata() {
    log "Creating backup metadata..."
    
    cat > "$BACKUP_PATH/metadata.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "git_commit": "$(cd "$PROJECT_DIR" && git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo 'unknown')",
    "docker_images": $(docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" images --format json 2>/dev/null | jq -s '.' || echo '[]'),
    "backup_size": "$(du -sh "$BACKUP_PATH" | cut -f1)",
    "backup_files": $(find "$BACKUP_PATH" -type f -exec basename {} \; | jq -R . | jq -s .)
}
EOF
    
    # Create human-readable metadata
    cat > "$BACKUP_PATH/README.md" << EOF
# Backup Information

- **Timestamp**: $TIMESTAMP
- **Date**: $(date)
- **Hostname**: $(hostname)
- **Git Commit**: $(cd "$PROJECT_DIR" && git rev-parse HEAD 2>/dev/null || echo 'unknown')
- **Git Branch**: $(cd "$PROJECT_DIR" && git branch --show-current 2>/dev/null || echo 'unknown')

## Backup Contents

- \`database.sql.gz\` - PostgreSQL database dump
- \`redis.rdb\` - Redis data dump
- \`uploads.tar.gz\` - User uploaded files
- \`nginx-config.tar.gz\` - Nginx configuration (if exists)
- \`ssl-certs.tar.gz\` - SSL certificates (if exists)
- \`.env.production\` - Production environment variables
- \`docker-compose*.yml\` - Docker Compose configurations

## Restore Instructions

1. Extract files: \`tar -xzf <backup-file>\`
2. Restore database: \`gunzip -c database.sql.gz | psql -U postgres -d nivaran\`
3. Restore uploads: \`tar -xzf uploads.tar.gz -C /path/to/uploads/\`
4. Restore configuration files to project directory
5. Restart services: \`docker-compose up -d\`

## Verification

To verify backup integrity:
- Database: \`gunzip -t database.sql.gz\`
- Uploads: \`tar -tzf uploads.tar.gz > /dev/null\`
- Configuration: \`tar -tzf nginx-config.tar.gz > /dev/null\`
EOF
    
    log "✓ Metadata created"
}

# Compress backup
compress_backup() {
    log "Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar czf "backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}/"
    
    # Verify compression
    if [ -f "backup_${TIMESTAMP}.tar.gz" ]; then
        local compressed_size=$(stat -f%z "backup_${TIMESTAMP}.tar.gz" 2>/dev/null || stat -c%s "backup_${TIMESTAMP}.tar.gz" 2>/dev/null)
        log "✓ Backup compressed (${compressed_size} bytes)"
        
        # Remove uncompressed directory
        rm -rf "$BACKUP_PATH"
    else
        error "Backup compression failed"
        exit 1
    fi
}

# Upload to S3 (optional)
upload_to_s3() {
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        log "Uploading backup to S3..."
        
        aws s3 cp "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" \
            "s3://$S3_BUCKET/$(hostname)/backup_${TIMESTAMP}.tar.gz" \
            --storage-class STANDARD_IA
        
        if [ $? -eq 0 ]; then
            log "✓ Backup uploaded to S3"
        else
            warn "S3 upload failed"
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Clean S3 backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        aws s3 ls "s3://$S3_BUCKET/$(hostname)/" | \
            awk '{print $4}' | \
            grep "backup_.*\.tar\.gz" | \
            head -n -5 | \
            while read backup; do
                aws s3 rm "s3://$S3_BUCKET/$(hostname)/$backup"
            done
    fi
    
    log "✓ Old backups cleaned up"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    local backup_file="$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
    
    # Test archive integrity
    if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
        error "Backup archive is corrupted"
        exit 1
    fi
    
    # Extract to temporary location for testing
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Verify database dump
    if [ -f "$temp_dir/backup_${TIMESTAMP}/database.sql.gz" ]; then
        if ! gunzip -t "$temp_dir/backup_${TIMESTAMP}/database.sql.gz" 2>/dev/null; then
            error "Database backup is corrupted"
            rm -rf "$temp_dir"
            exit 1
        fi
    fi
    
    # Verify uploads
    if [ -f "$temp_dir/backup_${TIMESTAMP}/uploads.tar.gz" ]; then
        if ! tar -tzf "$temp_dir/backup_${TIMESTAMP}/uploads.tar.gz" > /dev/null 2>&1; then
            warn "Uploads backup may be corrupted"
        fi
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log "✓ Backup verification completed"
}

# Main backup process
main() {
    log "Starting backup process..."
    
    # Check prerequisites
    if [ ! -d "$PROJECT_DIR" ]; then
        error "Project directory $PROJECT_DIR does not exist"
        exit 1
    fi
    
    if ! docker ps &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi
    
    # Create backup
    create_backup_dir
    backup_database
    backup_redis
    backup_uploads
    backup_configuration
    create_metadata
    compress_backup
    upload_to_s3
    verify_backup
    cleanup_old_backups
    
    log "🎉 Backup process completed successfully!"
    log "Backup location: $BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
}

# Script execution
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi