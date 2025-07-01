FROM php:8.2-fpm

WORKDIR /var/www/html

# Install system dependencies & PHP extensions
RUN apt-get update && apt-get install -y \
    git unzip libicu-dev libzip-dev zip libpng-dev libonig-dev libxml2-dev \
    libcurl4-openssl-dev pkg-config libssl-dev gnupg2 libpq-dev \
    && docker-php-ext-install pdo pdo_mysql intl zip opcache

RUN pecl install mongodb-1.21.0 \
    && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer files and install dependencies
COPY composer.json composer.lock ./
RUN composer install --no-interaction --optimize-autoloader --prefer-dist --no-scripts

# Copy application code
COPY . .

# Create .env.local with MongoDB configuration
RUN echo "MONGODB_URL=mongodb+srv://admin:admin@cluster0.bfb0y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" > .env.local \
    && echo "MONGODB_DB=ycorner-chat" >> .env.local \
    && echo "SYMFONY_APP_SECRET=ThisIsASecretForLocalDevelopmentOnly" >> .env.local \
    && echo "JWT_PASSPHRASE=root" >> .env.local \
    && echo "DATABASE_URL=mysql://root:root@db:3306/ycorner?serverVersion=8.0.37" >> .env.local

# Run composer scripts
RUN composer run-script post-install-cmd

# Set permissions for Symfony cache/logs
RUN chown -R www-data:www-data var

# Expose port 9000 for PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]
