# CLAUDE.md

Bilingual (Bangla/English) corporate portfolio website + CMS for KANIZ RIPA OVERSEAS, a Bangladeshi overseas recruitment agency. It is a portfolio site only. Never add applicant registration, job applications, CV handling, ATS or HR features.

## Layout

Single Laravel 13 project (do **not** split into separate backend/frontend projects).

- Laravel at the repo root: REST API under `/api/v1`, Sanctum SPA cookie auth, MySQL 8, Pest tests.
- `resources/js/`: React + TypeScript SPA (public site + `/admin`), built by Laravel's Vite plugin to `public/build/`.
- `resources/views/app.blade.php`: SPA shell, with SEO meta injected server-side by `SpaController`.
- `docs/`: ARCHITECTURE.md, DATABASE.md, UI-UX.md, TESTING.md (how to run every suite + perf results), MISSING-INFO.md, DEPLOYMENT.md, brand-assets/.

Read `docs/ARCHITECTURE.md` and `docs/DATABASE.md` before structural changes.

Frontend conventions (`resources/js`): pages in `pages/` (lazy-loaded in `app/router.tsx`), data hooks in `hooks/queries.ts` (always keyed by locale), UI strings in `locales/{en,bn}.ts` (keys must match; enforced by a test), design tokens in `resources/css/app.css` (`@theme`). Never letter-space or uppercase Bangla text. Sections with no published data must render nothing, not placeholder content.

Admin CMS (`resources/js/admin`, served at `/admin`): standard content modules are config-driven. Add or change fields in `admin/resources/configs.tsx` (`ResourceConfig`); `ResourceList`/`ResourceForm` and `lib/formModel.ts` handle loading, payloads, 422 errors, translations and publish rules. Special screens (media, company profile, messages, menus, SEO, settings, users, roles, activity) live in `admin/pages/`. UI permission checks (`useCan`) mirror the API's `module.action` permissions, but the API is the authority.

Routing gotcha: public routes are declared under literal `/bn` and `/en` (not `/:locale`), otherwise `/:locale/<page>` outranks `/admin/*`.

## Commands

- PHP: `composer install && php artisan migrate:fresh --seed && php artisan test`
- JS (Node 22+, installed via nvm: `. ~/.nvm/nvm.sh` in non-interactive shells): `npm install && npm run dev | build | test | typecheck | lint`
- Local dev: `composer run dev` (serve + queue + vite). PDF generation is queued, so a queue worker must run.
- Deployment check: `php artisan app:check-deployment` (exit 1 on critical problems). Deploy files live in `deploy/`; see `docs/DEPLOYMENT.md`. Production runs everything as the `kaniz` user, never `www-data`.

## Content rules (non-negotiable)

- Never invent company details, credentials, statistics, partners or testimonials. Use `[PLACEHOLDER]` and track the item in `docs/MISSING-INFO.md`.
- Companies are shown as partners only when `verification_status = verified`.
- A translation is public only when `is_reviewed = true`.
- Success stories need `consent_confirmed_at` before publishing.
- Unpublished files live on the private disk and are streamed via controllers.
