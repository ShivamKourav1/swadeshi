#!/bin/sh
set -e

# Setup storage and cache directories
mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Fix ownership
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

ROLE="${CONTAINER_ROLE:-app}"

echo "Starting container with role: ${ROLE} in environment: ${APP_ENV:-production}"

# Wait for PostgreSQL database connection if DB_HOST is configured
if [ -n "$DB_HOST" ]; then
    echo "Checking database connectivity ($DB_HOST)..."
    until php -r "
        try {
            \$host = getenv('DB_HOST');
            \$port = getenv('DB_PORT') ?: '5432';
            \$db   = getenv('DB_DATABASE') ?: 'laravel';
            \$user = getenv('DB_USERNAME') ?: 'root';
            \$pass = getenv('DB_PASSWORD') ?: '';
            \$driver = getenv('DB_CONNECTION') ?: 'pgsql';
            \$dsn  = \"\$driver:host=\$host;port=\$port;dbname=\$db\";
            \$pdo  = new PDO(\$dsn, \$user, \$pass, [PDO::ATTR_TIMEOUT => 3]);
            exit(0);
        } catch (Throwable \$e) {
            exit(1);
        }
    " 2>/dev/null; do
        echo "Database is not ready yet - retrying in 2 seconds..."
        sleep 2
    done
    echo "Database connected successfully!"
fi

# Application-specific startup tasks
if [ "$ROLE" = "app" ]; then
    # Create storage symlink
    php artisan storage:link --force || true

    # Run database migrations
    if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
        echo "Running database migrations..."
        php artisan migrate --force
    fi

    # Optimize caches for production
    if [ "${APP_ENV:-production}" = "production" ]; then
        echo "Optimizing application configuration, routes, and views..."
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
        php artisan event:cache
    fi
fi

exec "$@"
