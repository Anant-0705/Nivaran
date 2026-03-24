# Nivaran

Nivaran is a multi-service civic reporting platform consisting of a React Native (Expo) client, a Node.js/Express API, and a Python AI service. It supports user authentication, geotagged issue reporting, voting, rewards, and optional AI-assisted analysis.

## Repository Layout

- CivicReportApp/ - Expo React Native app (mobile + web)
- backend/ - Express API with Supabase/PostgreSQL
- ai-service/ - Python AI service

## Core Features

- Issue reporting with location, photos, and categories
- Map-based browsing and location filtering
- Upvotes and rewards/points system
- JWT-based authentication via Supabase
- Optional AI endpoints for analysis and moderation

## Tech Stack

- Client: React Native, Expo, React Navigation, Leaflet (web map)
- API: Node.js, Express, Supabase (PostgreSQL), JWT auth
- AI: Python service (model in ai-service/models)

## Services

### Backend API

Implemented in backend/src with REST endpoints for auth, issues, rewards, and users. See backend/src/docs for OpenAPI/Swagger specs.

### Mobile App

Implemented in CivicReportApp/src with screens for auth, reporting, map, rewards, and profile. Uses Supabase for auth and API calls to the backend.

### AI Service

Implemented in ai-service/ with model artifacts under ai-service/models. Exposes AI capabilities for issue analysis (optional integration).

## Environment Configuration

Each subproject has its own environment configuration. Refer to:

- CivicReportApp/README.md
- backend/README.md
- ai-service/README.md (if present)

## Local Development

1. Start backend API
	- cd backend
	- npm install
	- npm run dev
2. Start AI service (optional)
	- cd ai-service
	- pip install -r requirements.txt
	- python main.py
3. Start client app
	- cd CivicReportApp
	- npm install
	- npm start

## API Documentation

When the backend is running, Swagger UI is available at:

- http://localhost:3000/docs

## License

See subprojects for licensing details.