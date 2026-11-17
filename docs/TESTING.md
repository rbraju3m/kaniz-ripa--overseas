# Testing & Quality

## How to run

| Suite | Command | Needs |
|---|---|---|
| PHP feature + unit tests (Pest) | `php artisan test` | MySQL database `kaniz_ripa_test` |
| Real Chrome PDF rendering only | `php artisan test --group=chrome` | Google Chrome (auto-skipped if missing) |
| Frontend unit/component tests | `npm run test` | Node 22+ |
| Type check / lint | `npm run typecheck && npm run lint` | |
| Browser smoke test (admin screens) | `php tests/e2e/admin_e2e.php` | App running, `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`, Chrome |
| Browser CRUD workflow | `php tests/e2e/admin_crud_e2e.php` | same |

The e2e scripts accept `E2E_BASE_URL` (default `http://127.0.0.1:8000`) and `E2E_CHROME` (default `/usr/bin/google-chrome`). Screenshots go to `storage/app/e2e/` (git-ignored). The CRUD script creates a temporary portfolio item and deletes it again. **Never run it against production.**

## Coverage map (brief requirement → tests)

| Requirement | Where |
|---|---|
| Admin authentication (login, failure logging, inactive users, rate limit) | `tests/Feature/Admin/AuthTest.php` |
| Roles & permissions (viewer/editor/admin/super-admin, publish permission, last super admin) | `tests/Feature/Admin/RolesAndPermissionsTest.php`, `tests/Unit/PermissionsTest.php` |
| Page management (+ sections, review fallback, sanitising) | `tests/Feature/Admin/PageAndServiceTest.php` |
| Portfolio CRUD (translations, slugs, images, XSS cleaning, activity log) | `tests/Feature/Admin/PortfolioCrudTest.php` |
| Partner company CRUD (verified-only partners) | `tests/Feature/Admin/CompanyCrudTest.php` |
| Success story CRUD (consent gate, video hosts) | `tests/Feature/Admin/SuccessStoryCrudTest.php` |
| Gallery management + media upload security | `tests/Feature/Admin/GalleryAndMediaTest.php` |
| PDF upload, versioning, publishing, private files | `tests/Feature/Admin/CompanyProfileTest.php` |
| PDF generation (faked + real Chrome render, A4, embedded Bangla font) | `CompanyProfileTest.php`, `PdfRenderingTest.php` |
| Contact form (validation, honeypot, rate limit, admin inbox) | `tests/Feature/Public/ContactFormTest.php` |
| File security (SVG/HTML/PHP uploads rejected, private disk not served) | `GalleryAndMediaTest.php`, `CompanyProfileTest.php` |
| Public rendering (published + reviewed only, fallback, SEO meta, sitemap, robots, 404s, cache headers) | `tests/Feature/Public/*.php` |
| Frontend: contact form, i18n dictionaries, URL/phone/video helpers, admin form mapping | `resources/js/test/*.test.ts(x)` |

Lazy-loading is disabled in non-production (`Model::preventLazyLoading`), so any N+1 query on a tested path fails the suite.

## Security checks (Phase 7)

- `composer audit` and `npm audit`: no known vulnerabilities (2026-11-17).
- General API rate limit (`throttleApi`, 120/min per user or IP), plus stricter limits on login (5/min), contact form (3/min, 20/day) and downloads.
- Settings payloads validated (including the contact-persons structure) and stripped of tags.
- Public API responses: `Cache-Control: public, max-age=60` for anonymous GETs only. Admin and authenticated responses are never publicly cacheable.

## Performance (Lighthouse 12, mobile emulation, Nginx + gzip, 2026-11-17)

| Page | Performance | Accessibility | Best practices | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/bn` (home) | 93 | 100 | 100 | 2.0 s | 2.6 s | 0.028 | 170 ms |
| `/bn/contact` | 85 | 100 | 100 | 2.2 s | 4.1 s | 0 | 50 ms |
| `/en/portfolio` | 88–89 | 100 | 100 | 2.0–2.3 s | 3.5 s | 0–0.055 | 60 ms |

SEO scores locally are capped at 66 only because `robots.txt` blocks crawlers outside production (by design).

Optimisations applied:
- Site settings, menus and homepage data are embedded in the HTML, so first load has no API waterfall.
- A static first-paint shell inside `#root` shows immediately and React replaces it.
- `modulepreload` for the current page's lazy chunk, and `preload` for the two above-the-fold font files per language.
- Bangla font weights reduced to 400/600/700. Loading placeholders are full-height, so the footer never shifts into view.
- WCAG AA contrast fixes, accessible names that include visible text, and correct heading order.

Without gzip (e.g. `php artisan serve`) the same pages score about 50–65. Production **must** enable compression and long-lived caching for `/build/*` (see `docs/DEPLOYMENT.md`).
