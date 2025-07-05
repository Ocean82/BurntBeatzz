#!/bin/bash

echo "🚀 Deploying Burnt Beats..."

# Build and deploy to Vercel
echo "📦 Building application..."
npm run build

echo "🔄 Running database migrations..."
npm run db:migrate

echo "☁️ Deploying to Vercel..."
npm run deploy

echo "✅ Deployment complete!"
echo "🎵 Burnt Beats is now live!"
