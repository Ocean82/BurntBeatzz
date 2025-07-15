#!/bin/bash

# Burnt Beats Production Deployment Script
set -e

echo "🔥 Starting Burnt Beats Production Deployment..."

# Check if required environment variables are set
if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    echo "❌ Error: GOOGLE_CLOUD_PROJECT_ID environment variable is not set"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p ssl

# Build and start services
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.yml build --no-cache

echo "🚀 Starting services..."
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
    docker-compose logs app
    exit 1
fi

if docker-compose exec postgres pg_isready -U burnt_beats > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database health check failed"
    docker-compose logs postgres
    exit 1
fi

if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis health check failed"
    docker-compose logs redis
    exit 1
fi

# Run database migrations if needed
echo "🗄️ Running database migrations..."
# docker-compose exec app npm run db:migrate

# Display deployment info
echo ""
echo "🎉 Burnt Beats deployed successfully!"
echo "🌐 Application: http://localhost:3000"
echo "🗄️ Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "📝 To view logs:"
echo "  docker-compose logs -f app"
echo "  docker-compose logs -f postgres"
echo "  docker-compose logs -f redis"
echo ""
echo "🛑 To stop services:"
echo "  docker-compose down"
echo ""
echo "🔥 Burnt Beats is ready to create fire tracks!"
