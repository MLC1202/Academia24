ARG PHP_VERSION=8.3
FROM php:${PHP_VERSION}-apache

# pdo_mysql pro banco. sodium (cripto) ja vem na imagem oficial.
RUN docker-php-ext-install pdo_mysql \
 && a2enmod rewrite headers

# Raiz web = public/. src/ e .env ficam em /var/www, fora dela.
# .htaccess so vale dentro de /var/www (antes valia ate em /, o que nao precisa).
ENV APACHE_DOCUMENT_ROOT=/var/www/public
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
 && sed -ri '/<Directory \/var\/www\/>/,/<\/Directory>/ s!AllowOverride None!AllowOverride All!' /etc/apache2/apache2.conf \
 && sed -ri 's!^ServerTokens .*!ServerTokens Prod!; s!^ServerSignature .*!ServerSignature Off!' /etc/apache2/conf-available/security.conf

COPY php.ini "$PHP_INI_DIR/conf.d/zz-academia.ini"
