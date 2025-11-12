# Nginx Configuration for Production
FROM nginx:alpine

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY conf.d/ /etc/nginx/conf.d/
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Copy SSL certificates (if available)
COPY ssl/ /etc/nginx/ssl/ 2>/dev/null || true

# Create log directory
RUN mkdir -p /var/log/nginx

# Set proper permissions
RUN chmod 644 /etc/nginx/conf.d/*
RUN chmod 600 /etc/nginx/ssl/* 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]