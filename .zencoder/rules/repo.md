---
description: Repository Information Overview
alwaysApply: true
---

# Burnt Beats Information

## Summary
Burnt Beats is a web application for music production and voice cloning, built with Next.js and Python. It provides features for chord processing, MIDI manipulation, voice cloning, and audio synthesis. The application is deployed on Vercel and syncs with v0.dev deployments.

## Structure
- **app/**: Next.js application routes and pages
- **api/**: API endpoints for various services
- **backend/**: Python scripts for audio processing and MIDI manipulation
- **components/**: React components for the UI
- **lib/**: Utility functions, services, and middleware
- **public/**: Static assets and files
- **styles/**: CSS and styling files
- **scripts/**: Deployment and setup scripts

## Language & Runtime
**Frontend Language**: TypeScript/JavaScript
**Backend Languages**: JavaScript (Node.js), Python
**Node Version**: 18 (Alpine)
**Python Version**: Compatible with 3.x
**Build System**: Next.js
**Package Managers**: npm/yarn for JS, pip for Python

## Dependencies
**JavaScript Dependencies**:
- express: ^4.21.2
- cors: ^2.8.5
- dotenv: ^17.0.1
- helmet: ^8.1.0
- stripe: ^18.3.0
- next.js (implied by project structure)

**Python Dependencies**:
- mido: 1.3.2
- numpy: 1.24.3
- music21: 9.1.0
- librosa: 0.10.1
- soundfile: 0.12.1
- pydub: 0.25.1
- python-rtmidi: 1.5.5
- fluidsynth: 0.2

## Build & Installation
```bash
# Install JavaScript dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## Docker
**Dockerfile**: Multi-stage build optimized for production
**Base Image**: node:18-alpine
**Exposed Port**: 3000
**Configuration**: 
- Uses multi-stage build for optimization
- Supports different package managers (npm, yarn, pnpm)
- Includes health check endpoint

**Docker Compose**:
- Services: app, postgres, redis (optional), nginx (optional)
- Database: PostgreSQL 15
- Environment variables for configuration

## Testing
**JavaScript Testing**: Not explicitly defined in configuration
**Python Testing**:
- Framework: pytest 7.4.0
- Development Tools: black 23.7.0, flake8 6.0.0

## Main Components
**Frontend**: Next.js application with React components
**Backend Services**:
- Chord processing and MIDI generation
- Voice cloning and audio synthesis
- Stripe payment integration
- GitHub repository integration
- Audio analysis and processing

**Database**: PostgreSQL for data storage
**Storage**: Google Cloud Storage integration for file storage