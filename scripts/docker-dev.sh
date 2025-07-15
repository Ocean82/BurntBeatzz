#!/bin/bash

# Burnt Beats Development Environment Setup
set -e

echo "🔥 Starting Burnt Beats Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Create development directories
echo "📁 Creating development directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p .env.local

# Create development environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating development environment file..."
    cat > .env.local << EOF
# Burnt Beats Development Environment
NODE_ENV=development
DATABASE_URL=postgresql://burnt_beats:burnt_beats_password@localhost:5432/burnt_beats
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Cloud (add your keys when ready)
# GOOGLE_CLOUD_PROJECT_ID=your-project-id
# GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json
# GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name

# Stripe (add your keys when ready)
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# AI Services (add your keys when ready)
# ELEVENLABS_API_KEY=your-elevenlabs-key
# SUNO_API_KEY=your-suno-key
# MUBERT_API_KEY=your-mubert-key
EOF
    echo "✅ Created .env.local with development defaults"
fi

# Build development images
echo "🐳 Building development Docker images..."
docker-compose -f docker-compose.yml build

# Start development services
echo "🚀 Starting development services..."
docker-compose -f docker-compose.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
while ! docker-compose exec postgres pg_isready -U burnt_beats > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        docker-compose logs postgres
        exit 1
    fi
    sleep 1
done

echo "✅ Database is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
timeout=30
while ! docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Redis failed to start within 30 seconds"
        docker-compose logs redis
        exit 1
    fi
    sleep 1
done

echo "✅ Redis is ready"

# Start the application in development mode
echo "🔥 Starting Burnt Beats application..."
docker-compose -f docker-compose.yml up -d app

# Wait for app to be ready
echo "⏳ Waiting for application to start..."
timeout=120
while ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; do
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Application failed to start within 120 seconds"
        docker-compose logs app
        exit 1
    fi
    sleep 1
done

echo "✅ Application is ready"

# Display development info
echo ""
echo "🎉 Burnt Beats Development Environment Ready!"
echo "🌐 Application: http://localhost:3000"
echo "🗄️ Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🛠️ Development Commands:"
echo "  View logs:     docker-compose logs -f app"
echo "  Restart app:   docker-compose restart app"
echo "  Stop all:      docker-compose down"
echo "  Database CLI:  docker-compose exec postgres psql -U burnt_beats -d burnt_beats"
echo "  Redis CLI:     docker-compose exec redis redis-cli"
echo ""
echo "📝 Environment file: .env.local"
echo "📁 Upload directory: ./uploads"
echo "📋 Logs directory: ./logs"
echo ""
echo "🔥 Start creating fire beats at http://localhost:3000!"
