FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev zip libpng-dev libonig-dev libxml2-dev \
    libcurl4-openssl-dev pkg-config libssl-dev gnupg2 libpq-dev \
    && docker-php-ext-install pdo pdo_mysql intl zip opcache

RUN pecl install mongodb-1.21.0 \
    && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy app files
COPY . .

# Set permissions (dev-friendly)
RUN mkdir -p /var/www/html/var && chown -R www-data:www-data /var/www/html/var

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader --no-scripts

# Expose port 9000 for PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]
