# CivicReportApp Backend

This is the backend API for the CivicReportApp, a React Native application for reporting civic issues.

## Features

- RESTful API for civic issue reporting
- User authentication and profile management
- Rewards and points system
- Location-based issue filtering
- Voting system for issues

## Tech Stack

- Node.js with Express
- Supabase (PostgreSQL database)
- JWT authentication via Supabase
- CORS and security middleware

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/profile/:userId` - Get user profile

### Issues
- `POST /api/issues` - Create new issue
- `GET /api/issues` - Get all issues (with optional location filtering)
- `POST /api/issues/:issueId/upvote` - Upvote an issue
- `PUT /api/issues/:issueId/status` - Update issue status

### Rewards
- `GET /api/rewards/user/:userId` - Get user rewards
- `GET /api/rewards/stats/:userId` - Get user stats and rewards

### Users
- `GET /api/users/:userId` - Get user by ID

## Environment Variables

Create a `.env` file in the root directory with:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:19006

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Start the development server:
```bash
npm run dev
```

## Production Deployment

1. Set NODE_ENV to "production"
2. Configure your production Supabase credentials
3. Deploy to your preferred platform (Heroku, Railway, DigitalOcean, etc.)

### Deploy to Heroku

1. Create a new Heroku app
2. Set environment variables in Heroku config
3. Connect to GitHub and enable automatic deploys
4. Push to main branch to deploy

### Deploy to Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main

## API Usage

### Creating an Issue
```javascript
const response = await fetch('/api/issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Pothole on Main Street',
    description: 'Large pothole causing traffic issues',
    category: 'infrastructure',
    priority: 'medium',
    latitude: 40.7128,
    longitude: -74.0060,
    user_id: 'user-uuid',
    address: '123 Main St, City, State'
  })
});
```

### Getting Issues with Location Filter
```javascript
const response = await fetch('/api/issues?latitude=40.7128&longitude=-74.0060&radius=5000');
const data = await response.json();
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

## Security

- CORS configured for frontend domain
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet.js for security headers
- Input validation on all endpoints
- Supabase Row Level Security (RLS) policies

## Development

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route handlers (future)
├── routes/          # API routes
├── services/        # Business logic
└── server.js        # Main server file
```

### Adding New Endpoints

1. Create route handler in `src/routes/`
2. Add business logic to `src/services/`
3. Register route in `src/server.js`
4. Update this README

## Health Check

The server provides a health check endpoint:
- `GET /health` - Returns server status and timestamp
