#!/usr/bin/env bash
# Atomic (zero-downtime) deploy for an Ubuntu VPS.
#
# Layout:
#   /var/www/kaniz-ripa/releases/<timestamp>   one directory per release
#   /var/www/kaniz-ripa/shared/.env            production environment (never in git)
#   /var/www/kaniz-ripa/shared/storage         uploads, private PDFs, logs, sessions
#   /var/www/kaniz-ripa/shared/backups         backup archives
#   /var/www/kaniz-ripa/current -> releases/<timestamp>
#
# Run as the app user "kaniz" (the same user PHP-FPM, the queue worker and cron use),
# so no ownership changes are needed. Its only sudo right: reloading PHP-FPM.
# Usage:
#   APP_ROOT=/var/www/kaniz-ripa REPO=git@github.com:ORG/kaniz-ripa--overseas.git BRANCH=main ./deploy/deploy.sh
set -euo pipefail
umask 027

APP_ROOT="${APP_ROOT:-/var/www/kaniz-ripa}"
REPO="${REPO:?Set REPO to the git clone URL}"
BRANCH="${BRANCH:-main}"
PHP_FPM="${PHP_FPM:-php8.5-fpm}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

RELEASE="$APP_ROOT/releases/$(date +%Y%m%d%H%M%S)"
SHARED="$APP_ROOT/shared"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

log "Preparing shared directories"
mkdir -p "$APP_ROOT/releases" "$SHARED/storage"/{app/public,app/private,framework/{cache,sessions,views},logs} "$SHARED/backups" "$SHARED/chrome-home"
[ -f "$SHARED/.env" ] || { echo "Missing $SHARED/.env — copy deploy/.env.production.example and fill it in."; exit 1; }

log "Cloning $BRANCH into $RELEASE"
git clone --depth 1 --branch "$BRANCH" "$REPO" "$RELEASE"
cd "$RELEASE"

log "Linking shared .env and storage"
rm -rf storage
ln -s "$SHARED/storage" storage
ln -s "$SHARED/.env" .env

log "Installing PHP dependencies"
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader --classmap-authoritative

log "Building frontend"
npm ci --no-audit --no-fund
npm run build
rm -rf node_modules

log "Database migrations"
php artisan migrate --force
php artisan app:ensure-super-admin

log "Caching configuration, routes, views, events"
php artisan storage:link --force
php artisan optimize

log "Switching current release"
ln -sfn "$RELEASE" "$APP_ROOT/current.tmp"
mv -Tf "$APP_ROOT/current.tmp" "$APP_ROOT/current"

log "Reloading PHP-FPM and restarting queue workers"
sudo systemctl reload "$PHP_FPM"
php artisan queue:restart

log "Removing old releases (keeping $KEEP_RELEASES)"
ls -1dt "$APP_ROOT"/releases/* | tail -n +"$((KEEP_RELEASES + 1))" | xargs -r rm -rf

log "Post-deploy checks"
php artisan app:check-deployment || { echo "Deployment check failed — investigate, or roll back with: ln -sfn <previous release> $APP_ROOT/current && sudo systemctl reload $PHP_FPM"; exit 1; }

log "Deployed $(git rev-parse --short HEAD) to $RELEASE"
