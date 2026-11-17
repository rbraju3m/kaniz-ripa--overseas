# Kaniz Ripa Overseas — Corporate Website & CMS

Bilingual (Bangla / English) corporate portfolio website for **KANIZ RIPA OVERSEAS**, a Bangladesh-based overseas recruitment agency, with an admin CMS and a company profile PDF system.

> This is a portfolio website only. It deliberately has no job applications, applicant accounts, CV handling or recruitment workflow.

## Stack

- **Backend:** Laravel 13 (PHP 8.4.1+), MySQL 8, Sanctum (SPA cookie auth), spatie/laravel-permission, activity log, sitemap, backup
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, React Hook Form + Zod, Lucide, built from `resources/js` into one app with Laravel
- **PDF:** headless Chrome driven from PHP (`spatie/laravel-pdf` chrome driver); correct Bangla shaping with embedded fonts
- **Tests:** Pest (PHP), Vitest + Testing Library, headless-Chrome e2e scripts

## Quick start (local)

```bash
composer install
npm install
cp .env.example .env && php artisan key:generate
# create MySQL databases kaniz_ripa and kaniz_ripa_test, set DB_* and ADMIN_* in .env
php artisan migrate --seed
php artisan storage:link
composer run dev            # Laravel server + queue worker + Vite
```

- Website: <http://127.0.0.1:8000/bn> and `/en`
- Admin CMS: <http://127.0.0.1:8000/admin> (Super Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## Checks

```bash
php artisan test                         # 80+ Pest tests (MySQL)
npm run typecheck && npm run lint && npm run test
php artisan app:check-deployment         # environment / deployment sanity check
```

## Documentation

| Document | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, API overview, publishing safeguards, admin CMS structure |
| [docs/DATABASE.md](docs/DATABASE.md) | ER diagram, tables, seed policy |
| [docs/UI-UX.md](docs/UI-UX.md) | Brand analysis, design tokens, sitemap, page layouts |
| [docs/TESTING.md](docs/TESTING.md) | Test coverage map, how to run every suite, performance results |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Ubuntu VPS and Laravel Forge deployment, Nginx, queue, scheduler, SSL, backups, logging |
| [docs/MISSING-INFO.md](docs/MISSING-INFO.md) | Company information still needed from the client |

## Content rules

- No invented company details, credentials, statistics, partners or testimonials. Missing information is tracked on the admin dashboard and in `docs/MISSING-INFO.md`.
- A translation appears on the website only after it is marked **reviewed**.
- Companies appear as partners only when **verified**. Success stories need **recorded consent**.
