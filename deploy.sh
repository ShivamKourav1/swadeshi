#!/usr/bin/env bash
set -e

echo "🚀 Starting Deployment for Vastu Bhandar..."

# 1. Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.production.example to .env and configure credentials."
    exit 1
fi

# 2. Put application in maintenance mode (gracefully allows active bypass)
echo "🔒 Enabling maintenance mode..."
docker compose -f docker-compose.prod.yml exec -T app php artisan down --render="errors::503" || true

# 3. Pull latest code from repository (if in git)
if [ -d .git ]; then
    echo "📥 Pulling latest git repository changes..."
    git pull origin main
fi

# 4. Build and restart containers
echo "🏗️ Building Docker images..."
docker compose -f docker-compose.prod.yml build

echo "🔄 Starting updated containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 5. Wait for application container to be ready
echo "⏳ Waiting for app container to finish startup and migrations..."
sleep 5

# 6. Restart queue workers gracefully to load new code
echo "🔄 Restarting queue workers..."
docker compose -f docker-compose.prod.yml exec -T app php artisan queue:restart

# 7. Bring application out of maintenance mode
echo "🔓 Disabling maintenance mode..."
docker compose -f docker-compose.prod.yml exec -T app php artisan up

# 8. Clean up dangling images to preserve disk space
echo "🧹 Cleaning up outdated docker images..."
docker image prune -f

echo "✅ Deployment completed successfully!"
