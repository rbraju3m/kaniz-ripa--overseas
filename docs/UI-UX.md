# UI/UX Structure

## Brand analysis (from 5 recruitment posters)

- **Logo:** a royal-blue ring around a grey globe with a small orange airplane. The "KANIZ RIPA OVERSEAS" wordmark is set in bold brown-gold.
- **Poster palette:** mint-green header band, royal-blue footer band, green/red promotional accents.
- **Tone:** Bangla-first, direct and trustworthy. The website should feel calmer and more international than the posters. Poster layouts are **not** copied.

## Design tokens

| Token | Hex | Use |
|---|---|---|
| navy-900 | `#0B2A5B` | Primary text on light surfaces, header, footer |
| royal-600 | `#1D3FA8` | Links, focus rings (logo ring) |
| green-700 | `#15803D` | Primary actions (CTA, WhatsApp) |
| mint-50 | `#EEF8F2` / mint-100 `#DDF3E6` | Soft section backgrounds |
| gold-600 | `#A8741A` | Accent rules, eyebrows, numbers (wordmark) |
| orange-500 | `#E8742B` | Micro-accent only (airplane) |
| slate scale | Tailwind slate | Body text, borders |

**Typography**
- EN: *Plus Jakarta Sans* (headings), *Inter* (body).
- BN: *Hind Siliguri* (UI/headings) and *Noto Sans Bengali* (long text).
- All fonts are self-hosted with `font-display: swap`. Bangla text gets line-height +0.15 and no letter-spacing.

**Shape and motion:** radius 0.75rem on cards and 9999px on pills, soft navy-tinted shadows. Motion is limited to 150–300 ms fades and translate-y reveals, disabled under `prefers-reduced-motion`.

## Sitemap

```
/{bn|en}
├── /                       Home
├── /about                  About Us
├── /services               Services (+ /services/:slug)
├── /portfolio              Portfolio (+ /portfolio/:slug)
├── /partners               Partner companies (+ /partners/:slug)
├── /success-stories        Success stories (+ /success-stories/:slug)
├── /gallery                Gallery
├── /company-profile        Profile preview + download
└── /contact                Contact
/admin/*                    CMS (login, dashboard, 17 modules)
```

## Home page wireframe (mobile-first)

1. **Header:** logo, nav, BN/EN switcher, "Call" pill. On mobile, the nav moves into a sheet drawer.
2. **Hero:** headline + tagline, two CTAs (Download profile, Contact), a hero image of the office or deployments, and a strip of served-country flags.
3. **Intro:** short statement plus a key-facts row. Facts are shown only when verified credentials exist; there are no invented numbers.
4. **About teaser:** image + text + link.
5. **Services:** card grid with icons.
6. **Countries we serve:** flag cards (Saudi Arabia, Malaysia, Vietnam pending confirmation).
7. **Featured partners:** logo marquee/grid of verified companies only.
8. **Portfolio highlights:** 3 featured cards (cover, company, country, industry chip).
9. **Success stories:** carousel of consented stories. It is hidden entirely when there are none.
10. **Why choose us:** CMS page `why_choose_us`, icon list.
11. **Company profile:** navy band with a PDF cover mock and a download button.
12. **Contact:** office card, map, form.
13. **Footer:** logo, address, phones, quick links, socials, copyright.

## Admin UX

Sidebar layout with collapsible module groups (Content, Media, Company Profile, Messages, System) and a top bar with user menu and site link. Lists are tables with search, status filter and pagination. Forms put BN/EN on tabs, each with a "Reviewed" switch, and publish controls in a sticky side panel. The dashboard shows live counts and a "Missing information" checklist driven by placeholder settings.
