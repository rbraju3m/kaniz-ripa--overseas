<?php

use App\Enums\PublishStatus;
use App\Services\SettingsService;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(\Database\Seeders\SettingsSeeder::class);
});

it('redirects the root to a locale', function () {
    $this->get('/', ['Accept-Language' => 'en-US,en;q=0.9'])->assertRedirect('/en');
    $this->get('/', ['Accept-Language' => 'bn-BD,bn;q=0.9'])->assertRedirect('/bn');
});

it('renders localized SEO metadata on public pages', function () {
    $this->get('/bn/contact')
        ->assertOk()
        ->assertSee('<html lang="bn">', false)
        ->assertSee('<title>যোগাযোগ | কানিজ রিপা ওভারসিজ</title>', false)
        ->assertSee('<link rel="canonical" href="'.url('/bn/contact').'">', false)
        ->assertSee('hreflang="en" href="'.url('/en/contact').'"', false)
        ->assertSee('"@type":"EmploymentAgency"', false)
        ->assertSee('+880 2222270423', false);
});

it('never leaks placeholder settings into page metadata', function () {
    $html = $this->get('/en')->assertOk()->getContent();

    expect($html)->not->toContain('Your Trusted Partner') // tagline is still a placeholder
        ->not->toContain('[PLACEHOLDER]');
});

it('renders published portfolio detail metadata and 404s for drafts', function () {
    $live = portfolio([], ['en' => ['title' => 'Factory workers for Malaysia', 'slug' => 'factory-workers', 'summary' => 'Recruitment for a Malaysian factory.', 'is_reviewed' => true]]);
    portfolio(['status' => PublishStatus::Draft], ['en' => ['title' => 'Secret draft', 'slug' => 'secret-draft', 'is_reviewed' => true]]);

    $this->get('/en/portfolio/factory-workers')
        ->assertOk()
        ->assertSee('<meta property="og:title" content="Factory workers for Malaysia | Kaniz Ripa Overseas">', false)
        ->assertSee('Recruitment for a Malaysian factory.', false)
        ->assertSee('"@type":"BreadcrumbList"', false);

    $this->get('/en/portfolio/secret-draft')->assertNotFound()->assertSee('noindex', false);
    $this->get('/en/unknown-section')->assertNotFound();
});

it('serves the admin shell with noindex', function () {
    $this->get('/admin/login')->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});

it('lists only public URLs in the sitemap', function () {
    portfolio([], ['en' => ['title' => 'Live', 'slug' => 'live-project', 'is_reviewed' => true]]);
    portfolio(['status' => PublishStatus::Draft], ['en' => ['title' => 'Draft', 'slug' => 'draft-project', 'is_reviewed' => true]]);
    company(['slug' => 'hidden-co']);

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml')
        ->assertSee(url('/en/portfolio/live-project'), false)
        ->assertDontSee('draft-project', false)
        ->assertDontSee('hidden-co', false)
        ->assertSee('hreflang="en"', false);
});

it('blocks crawlers outside production', function () {
    $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /');
});

it('reads settings back from a persistent cache store', function () {
    // Regression: caching Eloquent models fails to unserialize under Laravel 13's cache class restrictions.
    config(['cache.default' => 'file']);
    Cache::store('file')->flush();

    expect(app(SettingsService::class)->get('phone'))->toBe('+880 2222270423');
    expect(app(SettingsService::class)->get('phone'))->toBe('+880 2222270423'); // second instance reads from cache
    expect(app(SettingsService::class)->get('address', null, 'en'))->toContain('Banani');

    Cache::store('file')->flush();
});

it('embeds the site payload so the client skips a request', function () {
    $this->seed(\Database\Seeders\SiteStructureSeeder::class);

    $this->get('/en')->assertOk()
        ->assertSee('"site":{"locale":"en"', false)
        ->assertSee('"menus":{"header"', false)
        ->assertDontSee('[PLACEHOLDER]', false);
});
