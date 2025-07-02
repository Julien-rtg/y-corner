FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git zip unzip curl libpng-dev libonig-dev libxml2-dev \
    libzip-dev libpq-dev libicu-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql intl zip gd opcache

RUN pecl install mongodb-1.21.0 && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
