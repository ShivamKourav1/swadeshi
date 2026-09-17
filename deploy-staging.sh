#!/usr/bin/env bash
set -e

echo "🚀 Starting Staging Deployment for Vastu Bhandar (dev.panchp.in)..."

# 1. Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please copy .env.staging.example to .env and configure credentials."
    exit 1
fi

# 2. Put application in maintenance mode (gracefully allows active bypass)
echo "🔒 Enabling maintenance mode..."
docker compose -f docker-compose.staging.yml exec -T app php artisan down --render="errors::503" || true

# 3. Pull latest code from repository (if in git)
if [ -d .git ]; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "stage")
    echo "📥 Pulling latest git repository changes on branch '$CURRENT_BRANCH'..."
    git pull origin "$CURRENT_BRANCH"
fi

# 4. Build and restart containers
echo "🏗️ Building Staging Docker images..."
docker compose -f docker-compose.staging.yml build

echo "🔄 Starting updated Staging containers..."
docker compose -f docker-compose.staging.yml up -d --remove-orphans

# 5. Wait for application container to be ready
echo "⏳ Waiting for app container to finish startup and migrations..."
sleep 5

# 6. Restart queue workers gracefully to load new code
echo "🔄 Restarting staging queue workers..."
docker compose -f docker-compose.staging.yml exec -T app php artisan queue:restart

# 7. Bring application out of maintenance mode
echo "🔓 Disabling maintenance mode..."
docker compose -f docker-compose.staging.yml exec -T app php artisan up

# 8. Clean up dangling images to preserve disk space
echo "🧹 Cleaning up outdated docker images..."
docker image prune -f

echo "✅ Staging deployment for dev.panchp.in completed successfully!"
