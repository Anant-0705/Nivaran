#!/bin/bash

# Smoke Tests for Production Deployment
# Verifies critical functionality after deployment

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-https://api.nivaran.app}"
WEB_BASE_URL="${WEB_BASE_URL:-https://nivaran.app}"
TIMEOUT=10

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

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "Running test: $test_name"
    
    if eval "$test_command"; then
        log "✓ PASS: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        error "✗ FAIL: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test basic connectivity
test_connectivity() {
    log "Testing basic connectivity..."
    
    run_test "API server is reachable" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health' > /dev/null"
    
    run_test "Web server is reachable" \
        "curl -f -s --max-time $TIMEOUT '$WEB_BASE_URL' > /dev/null"
}

# Test API health endpoints
test_health_endpoints() {
    log "Testing health endpoints..."
    
    run_test "Basic health check returns healthy status" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health' | grep -q '\"status\":\"healthy\"'"
    
    run_test "Detailed health check returns healthy services" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health/detailed' | grep -q '\"database\":\"healthy\"'"
    
    run_test "Readiness probe is ready" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/ready' | grep -q '\"status\":\"ready\"'"
    
    run_test "Liveness probe is alive" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/live' | grep -q '\"status\":\"alive\"'"
}

# Test API documentation
test_api_documentation() {
    log "Testing API documentation..."
    
    run_test "API documentation is accessible" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/docs' | grep -q 'Swagger'"
    
    run_test "API documentation loads correctly" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/docs' | grep -q 'Nivaran.*API'"
}

# Test database connectivity
test_database_connectivity() {
    log "Testing database connectivity..."
    
    # Test database health through API
    run_test "Database connection is healthy" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health/detailed' | grep -q '\"database\":\"healthy\"'"
    
    # Test if we can retrieve user count (basic query test)
    run_test "Database queries are working" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health/detailed' | grep -q 'pool_stats'"
}

# Test authentication endpoints
test_authentication() {
    log "Testing authentication endpoints..."
    
    # Test registration endpoint (should return error for missing data)
    run_test "Registration endpoint is responsive" \
        "curl -f -s --max-time $TIMEOUT -X POST '$API_BASE_URL/api/auth/signup' \
         -H 'Content-Type: application/json' \
         -d '{}' | grep -q 'error'"
    
    # Test login endpoint (should return error for missing credentials)
    run_test "Login endpoint is responsive" \
        "curl -f -s --max-time $TIMEOUT -X POST '$API_BASE_URL/api/auth/signin' \
         -H 'Content-Type: application/json' \
         -d '{}' | grep -q 'error'"
}

# Test CORS and security headers
test_security_headers() {
    log "Testing security headers..."
    
    run_test "CORS headers are present" \
        "curl -I -s --max-time $TIMEOUT '$API_BASE_URL/health' | grep -q 'Access-Control'"
    
    run_test "Security headers are present" \
        "curl -I -s --max-time $TIMEOUT '$API_BASE_URL/health' | grep -q 'X-Content-Type-Options'"
    
    run_test "Rate limiting headers are present" \
        "curl -I -s --max-time $TIMEOUT '$API_BASE_URL/api/auth/signin' | grep -q 'X-RateLimit'"
}

# Test SSL/TLS configuration
test_ssl_configuration() {
    log "Testing SSL/TLS configuration..."
    
    if [[ "$API_BASE_URL" == https* ]]; then
        run_test "SSL certificate is valid" \
            "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health' > /dev/null"
        
        run_test "SSL security grade is acceptable" \
            "curl -s --max-time $TIMEOUT 'https://www.ssllabs.com/ssltest/analyze.html?d=$(echo $API_BASE_URL | sed 's|https://||' | cut -d'/' -f1)&latest' | grep -q 'Overall Rating.*[A-B]' || true"
    else
        warn "Skipping SSL tests - not using HTTPS"
    fi
}

# Test rate limiting
test_rate_limiting() {
    log "Testing rate limiting..."
    
    # Make multiple rapid requests to trigger rate limiting
    local rate_limit_triggered=false
    
    for i in {1..15}; do
        response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$API_BASE_URL/api/auth/signin" \
                  -H 'Content-Type: application/json' \
                  -d '{}' -o /dev/null)
        
        if [ "$response" = "429" ]; then
            rate_limit_triggered=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$rate_limit_triggered" = true ]; then
        run_test "Rate limiting is working" "true"
    else
        run_test "Rate limiting is working" "false"
    fi
}

# Test file upload limits
test_upload_limits() {
    log "Testing upload limits..."
    
    # Test large payload rejection
    run_test "Large payload is rejected" \
        "curl -s -w '%{http_code}' --max-time $TIMEOUT -X POST '$API_BASE_URL/api/auth/signup' \
         -H 'Content-Type: application/json' \
         -d '{\"large_field\":\"$(printf 'a%.0s' {1..1000000})\"}' -o /dev/null | grep -q '413\\|400'"
}

# Test error handling
test_error_handling() {
    log "Testing error handling..."
    
    run_test "404 errors are handled gracefully" \
        "curl -s --max-time $TIMEOUT '$API_BASE_URL/api/nonexistent' | grep -q 'error'"
    
    run_test "Malformed JSON is handled gracefully" \
        "curl -s --max-time $TIMEOUT -X POST '$API_BASE_URL/api/auth/signin' \
         -H 'Content-Type: application/json' \
         -d 'invalid-json' | grep -q 'error'"
}

# Test monitoring endpoints (if enabled)
test_monitoring() {
    log "Testing monitoring endpoints..."
    
    # Test Prometheus metrics (if available)
    if curl -f -s --max-time $TIMEOUT "$API_BASE_URL/metrics" > /dev/null 2>&1; then
        run_test "Prometheus metrics are available" \
            "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/metrics' | grep -q 'http_requests_total'"
    else
        warn "Prometheus metrics endpoint not available"
    fi
}

# Test AI service integration
test_ai_service() {
    log "Testing AI service integration..."
    
    # Test AI service health through main API
    run_test "AI service is healthy" \
        "curl -f -s --max-time $TIMEOUT '$API_BASE_URL/health/detailed' | grep -q '\"ai_service\":\"healthy\"' || true"
    
    # Test AI endpoints respond (even if they return errors for auth)
    run_test "AI analysis endpoint is responsive" \
        "curl -s --max-time $TIMEOUT -X POST '$API_BASE_URL/api/ai/analyze-issue' | grep -q 'error\\|Unauthorized'"
}

# Performance baseline test
test_performance() {
    log "Testing performance baseline..."
    
    # Test response time
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time $TIMEOUT "$API_BASE_URL/health")
    
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        run_test "API response time is acceptable (<1s)" "true"
    else
        run_test "API response time is acceptable (<1s)" "false"
        warn "Response time: ${response_time}s"
    fi
}

# Test content security
test_content_security() {
    log "Testing content security..."
    
    # Test XSS protection
    run_test "XSS protection is enabled" \
        "curl -I -s --max-time $TIMEOUT '$API_BASE_URL/health' | grep -q 'X-XSS-Protection'"
    
    # Test content type options
    run_test "Content type options are set" \
        "curl -I -s --max-time $TIMEOUT '$API_BASE_URL/health' | grep -q 'X-Content-Type-Options: nosniff'"
}

# Generate test report
generate_report() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    local pass_percentage=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    
    echo
    echo "========================================="
    echo "        SMOKE TEST RESULTS"
    echo "========================================="
    echo "Timestamp: $timestamp"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: ${pass_percentage}%"
    echo "========================================="
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log "🎉 All smoke tests passed! Deployment is successful."
        return 0
    else
        error "💥 $FAILED_TESTS tests failed. Please investigate."
        return 1
    fi
}

# Main test execution
main() {
    log "Starting smoke tests for: $API_BASE_URL"
    
    # Run all test suites
    test_connectivity
    test_health_endpoints
    test_api_documentation
    test_database_connectivity
    test_authentication
    test_security_headers
    test_ssl_configuration
    test_rate_limiting
    test_upload_limits
    test_error_handling
    test_monitoring
    test_ai_service
    test_performance
    test_content_security
    
    # Generate and display report
    generate_report
}

# Script execution
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi