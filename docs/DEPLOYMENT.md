# Deployment Guide — Kaniz Ripa Overseas

One Laravel 13 application (API, admin CMS and React site in one codebase). It needs:

| Component | Version / notes |
|---|---|
| OS | Ubuntu 24.04 LTS (2 vCPU / 2 GB RAM minimum; 4 GB recommended for Chrome PDF generation) |
| PHP | **8.4.1 or newer** (developed and tested on 8.5). Extensions: `bcmath ctype curl dom fileinfo gd intl mbstring mysql opcache pdo xml zip` |
| MySQL | 8.0+, `utf8mb4` |
| Web server | Nginx 1.24+ with PHP-FPM |
| Node.js | 22 LTS or newer: **build time only** (`npm run build`); not needed at runtime |
| Google Chrome | Stable, for company-profile PDF generation (driven from PHP; no Node needed) |
| Process manager | Supervisor (queue worker) + cron (scheduler) |

Every file referenced below is in `deploy/`.

---

## A. Ubuntu VPS (manual)

### 1. Base packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y software-properties-common curl git unzip ufw supervisor nginx mysql-server certbot python3-certbot-nginx
sudo add-apt-repository -y ppa:ondrej/php && sudo apt update
sudo apt install -y php8.5-fpm php8.5-cli php8.5-{bcmath,curl,gd,intl,mbstring,mysql,opcache,xml,zip}
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer

# Node (build only) via nvm for the deploy user
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && . ~/.nvm/nvm.sh && nvm install 22

# Google Chrome (PDF generation) + emoji font for the country flags in PDFs
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install -y ./google-chrome-stable_current_amd64.deb fonts-noto-color-emoji fontconfig
rm google-chrome-stable_current_amd64.deb

sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Brand fonts (Hind Siliguri, Inter, Plus Jakarta Sans) ship with the app and are embedded into PDFs, so no system Bangla font is required.

### 2. App user and PHP configuration

Everything (deploys, PHP-FPM, queue worker, cron) runs as one dedicated, unprivileged user `kaniz`. This avoids file-ownership conflicts and isolates the site from other sites on the server.

```bash
sudo adduser --disabled-password --gecos "" kaniz
sudo usermod -aG kaniz www-data            # lets Nginx read public/ and storage/app/public
sudo mkdir -p /var/www/kaniz-ripa && sudo chown kaniz:kaniz /var/www/kaniz-ripa && sudo chmod 750 /var/www/kaniz-ripa
# Deploy key: add /home/kaniz/.ssh/id_ed25519.pub as a read-only deploy key on the Git host.
sudo -u kaniz ssh-keygen -t ed25519 -N "" -f /home/kaniz/.ssh/id_ed25519

sudo cp deploy/php/99-kaniz-ripa.ini /etc/php/8.5/fpm/conf.d/
sudo cp deploy/php/99-kaniz-ripa.ini /etc/php/8.5/cli/conf.d/
sudo cp deploy/php/kaniz-ripa-pool.conf /etc/php/8.5/fpm/pool.d/kaniz-ripa.conf
sudo systemctl restart php8.5-fpm
```

The pool runs as `kaniz` on `/run/php/kaniz-ripa.sock`, with `open_basedir` limited to the app directory and shell-execution functions disabled. `proc_open` stays enabled because Chrome PDF rendering needs it.

Key values: `upload_max_filesize=25M`, `post_max_size=30M` (20 MB PDF uploads), OPcache with `validate_timestamps=0` (the deploy script reloads PHP-FPM), `expose_php=Off`, secure session cookies.

### 3. MySQL

```bash
sudo mysql_secure_installation
sudo mysql <<'SQL'
CREATE DATABASE kaniz_ripa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kaniz_ripa'@'localhost' IDENTIFIED BY 'USE-A-LONG-RANDOM-PASSWORD';
GRANT ALL PRIVILEGES ON kaniz_ripa.* TO 'kaniz_ripa'@'localhost';
FLUSH PRIVILEGES;
SQL
```

Recommended `/etc/mysql/mysql.conf.d/zz-kaniz-ripa.cnf`:

```ini
[mysqld]
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci
bind-address         = 127.0.0.1
innodb_buffer_pool_size = 512M   # ~25-40% of RAM
max_connections      = 100
```

Use a password without shell-special characters (`!`, `$`, backticks), or quote it carefully: `!` in double quotes is mangled by bash history expansion.

### 4. Directory layout and first deploy

```bash
sudo -iu kaniz
mkdir -p /var/www/kaniz-ripa/shared
cp deploy/.env.production.example /var/www/kaniz-ripa/shared/.env   # then edit every value
chmod 600 /var/www/kaniz-ripa/shared/.env
php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"      # → APP_KEY
```

The deploy needs exactly one privileged command. Grant it without wildcards (`sudo visudo -f /etc/sudoers.d/kaniz-ripa`):

```
kaniz ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.5-fpm
```

Deploy (as `kaniz`):

```bash
APP_ROOT=/var/www/kaniz-ripa REPO=git@github.com:ORG/kaniz-ripa--overseas.git BRANCH=main ./deploy/deploy.sh
```

`deploy/deploy.sh` (run as `kaniz`, `umask 027`) clones into `releases/<timestamp>`, links the shared `.env` and `storage`, runs `composer install --no-dev`, `npm ci && npm run build`, `migrate --force`, `optimize`, switches the `current` symlink atomically, reloads PHP-FPM, restarts queue workers, keeps the last 5 releases and finishes with `php artisan app:check-deployment`.

**First deploy only:** create the Super Admin, then remove the seed password:

```bash
cd /var/www/kaniz-ripa/current
php artisan db:seed --force          # roles, permissions, countries, verified poster data (drafts), Super Admin
# now delete ADMIN_PASSWORD (and ADMIN_EMAIL) from shared/.env and run: php artisan config:cache
```

Seeding is idempotent and never publishes anything: poster companies stay unverified and portfolio items stay drafts.

**Rollback:** `ln -sfn /var/www/kaniz-ripa/releases/<previous> /var/www/kaniz-ripa/current && sudo systemctl reload php8.5-fpm && php artisan queue:restart`. Migrations are additive; roll back the database only from a backup.

### 5. Nginx and SSL

```bash
sudo mkdir -p /var/www/letsencrypt
sudo cp deploy/nginx/kaniz-ripa.conf /etc/nginx/sites-available/kaniz-ripa.conf
sudo sed -i 's/YOUR-DOMAIN.com/kanizripa.example/g' /etc/nginx/sites-available/kaniz-ripa.conf   # your real domain
# First obtain the certificate (temporarily comment out the two 443 server blocks, or use --standalone):
sudo certbot certonly --nginx -d YOUR-DOMAIN.com -d www.YOUR-DOMAIN.com
sudo ln -s /etc/nginx/sites-available/kaniz-ripa.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl status certbot.timer     # automatic renewal
```

The site config provides HTTPS with HSTS and a `www` → apex redirect (one canonical host, which SEO and Sanctum both need). It gzips text assets, caches `/build/*` immutably for a year and `/storage/*` for 30 days, never executes PHP inside `/storage`, blocks dotfiles (`.env`, `.git`), and caps request bodies at 25 MB. Laravel adds a nonce-based Content-Security-Policy to HTML responses (`CSP_ENABLED=true`).

Ubuntu 24.04 ships Nginx 1.24, so the config uses `listen 443 ssl http2;`. On Nginx 1.25.1+ switch to `listen 443 ssl;` + `http2 on;`.

### 6. Queue worker (PDF generation)

```bash
sudo cp deploy/supervisor/kaniz-ripa-worker.conf /etc/supervisor/conf.d/
sudo supervisorctl reread && sudo supervisorctl update && sudo supervisorctl start 'kaniz-ripa-worker:*'
sudo supervisorctl status
```

The worker runs as `kaniz` with `HOME=/var/www/kaniz-ripa/shared/chrome-home`. Chrome needs a writable home directory for its profile and crash handler, and keeping it inside the app directory satisfies `open_basedir`. The same path is set as `LARAVEL_PDF_CHROME_HOME` in `.env` for PDFs generated from web requests.

### 7. Scheduler (backups and housekeeping)

```bash
sudo cp deploy/cron/kaniz-ripa /etc/cron.d/kaniz-ripa && sudo chmod 644 /etc/cron.d/kaniz-ripa
php artisan schedule:list
```

| Task | When (Asia/Dhaka) |
|---|---|
| `backup:clean` (retention) | daily 01:30 |
| `backup:run` (database + uploads) | daily 02:00 |
| `backup:monitor` (alerts if the newest backup is > 1 day old) | daily 09:00 |
| `activitylog:clean --days=365` | weekly |
| `queue:prune-failed --hours=720` | weekly |
| `sanctum:prune-expired` | daily |

### 8. Chrome / PDF check

```bash
sudo -u kaniz HOME=/var/www/kaniz-ripa/shared/chrome-home google-chrome --headless=new --disable-gpu --dump-dom about:blank
cd /var/www/kaniz-ripa/current && sudo -u kaniz php artisan tinker --execute 'App\Jobs\GenerateCompanyProfilePdf::dispatchSync("bn");'
```

Then check *Admin → Company profile PDF → Version history*.

If Chrome fails with *"No usable sandbox"*, Google Chrome's setuid helper is normally present. Check it is installed: `ls -l /opt/google/chrome/chrome-sandbox` must show `-rwsr-xr-x root`. Use `LARAVEL_PDF_CHROME_NO_SANDBOX=true` only as a last resort. It is a defence-in-depth reduction, acceptable here only because Chrome renders the app's own HTML with images and fonts inlined as `data:` URIs and loads no remote content.

### 9. Backups

- **Location:** archives (gzipped MySQL dump + `storage/app/public` + `storage/app/private`) go to `BACKUP_PATH` (`/var/www/kaniz-ripa/shared/backups`).
- **Retention:** all backups for 7 days, daily for 16 days, weekly for 8 weeks, monthly for 4 months, yearly for 2 years (`config/backup.php`).
- **Off-site copy (strongly recommended):** `composer require league/flysystem-aws-s3-v3`, fill in the `AWS_*` variables (any S3-compatible storage works), set `BACKUP_DISKS=backups,s3`.
- **Failure alerts:** set `BACKUP_NOTIFICATION_EMAIL` and working SMTP settings.
- **Restore test (do this once after go-live):**
  ```bash
  unzip -p <archive>.zip db-dumps/mysql-kaniz_ripa.sql.gz | gunzip | mysql -u root kaniz_ripa_restore_test
  unzip <archive>.zip 'var/www/*/storage/app/*' -d /tmp/restore-check
  ```
- **Manual backup:** `php artisan backup:run`. **List and health:** `php artisan backup:list`.

### 10. Logging

- **Laravel:** `LOG_CHANNEL=daily`, `LOG_DAILY_DAYS=30`, `LOG_LEVEL=warning` → `shared/storage/logs/laravel-YYYY-MM-DD.log`.
- **Queue worker:** `shared/storage/logs/worker.log` (rotated by Supervisor, 5 × 10 MB).
- **Nginx:** `/var/log/nginx/kaniz-ripa.*.log`; install `deploy/logrotate/kaniz-ripa` into `/etc/logrotate.d/`.
- **Audit trail:** every CMS change, sign-in and failed sign-in is in *Admin → Activity log* (kept 365 days).
- **Health endpoint:** `GET /up` returns 200 when the app boots. Point an uptime monitor at it.

### 11. Post-deploy verification

```bash
cd /var/www/kaniz-ripa/current
php artisan app:check-deployment          # exits 1 on any critical problem
curl -sI https://YOUR-DOMAIN.com/bn | grep -iE 'strict-transport|content-security'
curl -s https://YOUR-DOMAIN.com/robots.txt   # must allow crawling and list the sitemap
curl -s https://YOUR-DOMAIN.com/sitemap.xml | head
```

Then sign in at `/admin`, upload an image, save a draft, and generate the company profile PDF.

---

## B. Laravel Forge

1. **Server:** create an App Server with PHP 8.5 (8.4.1+), MySQL 8 and Nginx. Under *Server → PHP*, set upload max file size to 25 MB.
2. **Site:** add `YOUR-DOMAIN.com` with web directory `/public` and PHP 8.5. Connect the Git repository and branch `main`. **Enable zero-downtime deployments.**
3. **Database:** *Server → Database*: create `kaniz_ripa` and a user (Forge uses `utf8mb4`).
4. **Environment:** paste `deploy/.env.production.example` into *Site → Environment* and fill it in. With Forge's default user, set `LARAVEL_PDF_CHROME_HOME=/home/forge/.chrome-pdf` (create the directory) and point `BACKUP_PATH` at a directory outside the release folder, e.g. `/home/forge/backups/kaniz-ripa`.
5. **Deploy script:** replace it with `deploy/forge-deploy.sh`. Node is preinstalled on Forge servers.
6. **SSL:** *Site → SSL → Let's Encrypt* for both apex and www. Add the `www` → apex redirect under *Site → Redirects*.
7. **Nginx:** *Site → Edit Nginx Configuration*. Add the `gzip`, `/build/` (immutable caching), `/storage/` (no PHP) and `client_max_body_size 25m` blocks from `deploy/nginx/kaniz-ripa.conf`. Forge already handles the PHP location and security basics.
8. **Queue:** *Site → Queue*: connection `database`, timeout 180, tries 2, processes 1.
9. **Scheduler:** *Server → Scheduler*: `php /home/forge/YOUR-DOMAIN.com/current/artisan schedule:run`, every minute.
10. **Chrome:** SSH in and run the Chrome install commands from step A1.
11. **First deploy:** click *Deploy Now*. Then SSH in, run `php artisan db:seed --force`, remove `ADMIN_PASSWORD`/`ADMIN_EMAIL` from the environment, and run `php artisan app:check-deployment`.
12. **Backups:** Forge's database backups (Server → Backups) can complement `spatie/laravel-backup`, but the app's own backups also include uploaded files. Keep both, with an off-site target.

---

## Production environment reference

See `deploy/.env.production.example` (every variable is commented). Security-relevant values:

| Variable | Production value | Why |
|---|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` | No stack traces or debug data leak |
| `APP_URL` | `https://YOUR-DOMAIN.com` | Canonical URLs, sitemap, PDF footer, Sanctum |
| `SESSION_SECURE_COOKIE` | `true` | Admin session cookie only over HTTPS |
| `SESSION_ENCRYPT` | `true` | Session payload encrypted at rest |
| `SANCTUM_STATEFUL_DOMAINS` | `YOUR-DOMAIN.com` | Admin SPA cookie authentication |
| `CSP_ENABLED` | `true` | Nonce-based Content-Security-Policy |
| `LOG_LEVEL` | `warning` | Avoid logging request details |
| `ADMIN_PASSWORD` | *(removed after first seed)* | No credentials left in the environment |

## Go-live checklist

- [ ] `php artisan app:check-deployment` → all critical checks pass
- [ ] HTTPS + HSTS active; `www` redirects to apex
- [ ] `/robots.txt` allows crawling and lists `/sitemap.xml`; submit the sitemap in Google Search Console
- [ ] Super Admin created, seed password removed, extra admin users created with least-privilege roles
- [ ] Real company information entered and reviewed (see `docs/MISSING-INFO.md`); placeholders cleared on the dashboard
- [ ] Partner companies verified in writing before "Show as partner" is enabled
- [ ] Success stories published only with recorded consent
- [ ] Company profile PDF generated or uploaded and published
- [ ] First backup created and a restore tested; off-site copy configured
- [ ] Queue worker running (`supervisorctl status`); scheduler cron installed
- [ ] Uptime monitor on `/up`
