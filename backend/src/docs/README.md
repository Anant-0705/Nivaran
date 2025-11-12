# API Documentation

This directory contains comprehensive API documentation for the Nivaran Civic Reporting platform using OpenAPI/Swagger specifications.

## Overview

The API documentation is automatically generated using `swagger-jsdoc` and served via `swagger-ui-express`. It provides interactive documentation for all endpoints with:

- Complete request/response schemas
- Authentication requirements  
- Example requests and responses
- Error handling documentation
- Rate limiting information

## Structure

```
src/docs/
├── swagger.js           # Main Swagger configuration and schemas
├── auth.swagger.js      # Authentication endpoint documentation
├── issues.swagger.js    # Issue management endpoint documentation
├── users.swagger.js     # User management endpoint documentation
├── rewards.swagger.js   # Rewards system endpoint documentation
├── ai.swagger.js        # AI-powered features documentation
└── README.md           # This file
```

## Accessing Documentation

### Development
- **Interactive Docs**: http://localhost:3000/docs
- **JSON Spec**: http://localhost:3000/docs-json (if implemented)

### Production
- **Interactive Docs**: https://api.nivaran.app/docs
- **JSON Spec**: https://api.nivaran.app/docs-json

## Authentication

The API uses JWT Bearer tokens for authentication. Most endpoints require authentication except:
- Health check endpoints
- Authentication endpoints (signup, signin)
- Public documentation

### Getting Started

1. Register a new account via `POST /api/auth/signup`
2. Sign in via `POST /api/auth/signin` to get access token
3. Include token in Authorization header: `Bearer <your-token>`

## API Endpoints

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Comprehensive health with dependencies
- `GET /ready` - Kubernetes readiness probe
- `GET /live` - Kubernetes liveness probe

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Authenticate user
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user profile

### Issues Management
- `GET /api/issues` - List issues with filtering and pagination
- `POST /api/issues` - Create new issue
- `GET /api/issues/{id}` - Get issue details
- `PUT /api/issues/{id}` - Update issue
- `DELETE /api/issues/{id}` - Delete issue
- `POST /api/issues/{id}/vote` - Vote on issue
- `POST /api/issues/{id}/comments` - Add comment

### Users
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile
- `GET /api/users/{id}/issues` - Get user's issues
- `GET /api/users/{id}/rewards` - Get user's rewards
- `GET /api/users/leaderboard` - Community leaderboard

### Rewards System
- `GET /api/rewards` - List available rewards
- `GET /api/rewards/{id}` - Get reward details
- `POST /api/rewards/claim/{id}` - Claim earned reward
- `GET /api/rewards/progress` - Get user's reward progress

### AI Features
- `POST /api/ai/analyze-issue` - Analyze issue with AI
- `POST /api/ai/generate-report` - Generate comprehensive reports
- `POST /api/ai/suggest-solutions` - Get solution suggestions
- `POST /api/ai/moderate-content` - Content moderation

## Rate Limiting

The API implements tiered rate limiting:

- **Global**: 100 requests per 15 minutes
- **API Routes**: 60 requests per 15 minutes  
- **Auth Routes**: 10 requests per 15 minutes
- **Speed Limiting**: 10 requests per second

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": 400,
  "details": {
    "field": "additional error context"
  }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Data Schemas

### Core Entities
- **User**: User account information and profile data
- **Issue**: Civic issues with location, images, and metadata
- **Comment**: User comments on issues
- **Reward**: Achievement and reward system data
- **Vote**: User votes on issues

### Location Data
The API supports geospatial queries using PostGIS:
- Latitude/longitude coordinates
- Address geocoding
- Distance-based filtering
- Radius searches

## Security Features

- JWT-based authentication
- Rate limiting per endpoint type
- Input sanitization and validation
- XSS and SQL injection prevention
- CORS configuration
- Security headers (Helmet.js)

## Development

To update the documentation:

1. Edit the appropriate `*.swagger.js` file
2. Restart the development server
3. Documentation is automatically regenerated

### Adding New Endpoints

1. Add JSDoc comments with `@swagger` annotations to route files
2. Update schemas in `swagger.js` if needed
3. Test the documentation at `/docs`

### Best Practices

- Include comprehensive examples
- Document all required parameters
- Specify proper response schemas
- Include error scenarios
- Keep descriptions clear and concise

## Support

For API support or questions about the documentation:
- Email: support@nivaran.app
- Documentation: https://docs.nivaran.app
- GitHub Issues: https://github.com/nivaran/api/issues