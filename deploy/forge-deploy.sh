# Laravel Forge deploy script — paste into Site → Deployments → Deploy Script.
# With Forge's zero-downtime deployments enabled, Forge manages releases/ and the
# shared storage + .env; this script runs inside the new release directory.
cd $FORGE_RELEASE_DIRECTORY

$FORGE_COMPOSER install --no-dev --no-interaction --prefer-dist --optimize-autoloader

npm ci --no-audit --no-fund
npm run build

$FORGE_PHP artisan migrate --force
$FORGE_PHP artisan storage:link --force
$FORGE_PHP artisan optimize

# Forge activates the release after this script, then:
$FORGE_PHP artisan queue:restart
$FORGE_PHP artisan app:check-deployment || true
