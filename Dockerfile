# =========================================================================
# Stage 1: Frontend Asset Compilation
# =========================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source assets needed for compilation
COPY vite.config.js ./
COPY resources ./resources
COPY public ./public

# Build compiled production assets to public/build
RUN npm run build

# =========================================================================
# Stage 2: PHP-FPM Production Application Image
# =========================================================================
FROM php:8.2-fpm-alpine AS production

LABEL maintainer="Vastu Bhandar Team"
WORKDIR /var/www/html

# Install build and runtime system packages
RUN apk add --no-cache \
    bash \
    curl \
    freetype \
    freetype-dev \
    icu-data-full \
    icu-dev \
    libjpeg-turbo \
    libjpeg-turbo-dev \
    libpng \
    libpng-dev \
    libzip \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev \
    su-exec \
    $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        exif \
        gd \
        intl \
        opcache \
        pcntl \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del --no-network $PHPIZE_DEPS \
    && rm -rf /tmp/pear

# Copy Composer binary from official Composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy custom PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom-php.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Copy composer definitions and install vendor dependencies
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# Copy the rest of the application files
COPY . .

# Copy compiled frontend assets from the frontend-builder stage
COPY --from=frontend-builder /app/public/build ./public/build

# Finish Composer dump-autoload and package discovery
RUN composer dump-autoload --optimize --no-dev

# Setup entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Setup proper directory permissions
RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]

# =========================================================================
# Stage 3: Nginx Production Web Server
# =========================================================================
FROM nginx:alpine AS web

# Remove default configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy compiled public assets directly from production stage
COPY --from=production /var/www/html/public /var/www/html/public

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
