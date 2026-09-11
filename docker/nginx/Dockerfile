ARG APP_IMAGE=ecommerce-app:prod
FROM ${APP_IMAGE} AS app_source

FROM nginx:alpine

# Remove default configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom Nginx server block
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy compiled public assets (including vite build assets) directly from app image
COPY --from=app_source /var/www/html/public /var/www/html/public

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
