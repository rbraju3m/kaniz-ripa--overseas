<?php

use App\Enums\PublishStatus;

it('returns site settings without placeholders', function () {
    $this->seed(\Database\Seeders\SettingsSeeder::class);
    $this->seed(\Database\Seeders\SiteStructureSeeder::class);

    $res = $this->getJson('/api/v1/site?locale=en')->assertOk()
        ->assertJsonPath('data.settings.contact.phone', '+880 2222270423')
        ->assertJsonPath('data.menus.header.0.label', 'Home');

    expect($res->json('data.settings.contact'))->not->toHaveKey('email')
        ->and($res->json('data.settings.general'))->not->toHaveKey('license_number');
});

it('lists only published portfolios with reviewed translations', function () {
    portfolio();
    portfolio(['status' => PublishStatus::Draft]);
    portfolio([], ['en' => ['title' => 'Unreviewed', 'slug' => 'unreviewed', 'is_reviewed' => false]]);

    $this->getJson('/api/v1/portfolios')->assertOk()->assertJsonCount(1, 'data');
});

it('falls back to the reviewed English translation', function () {
    $p = portfolio([], [
        'en' => ['title' => 'English title', 'slug' => 'eng', 'is_reviewed' => true],
        'bn' => ['title' => 'অপর্যালোচিত', 'slug' => 'bng', 'is_reviewed' => false],
    ]);

    $this->getJson('/api/v1/portfolios/eng?locale=bn')->assertOk()
        ->assertJsonPath('data.title', 'English title')
        ->assertJsonPath('data.locale', 'en');

    // An unreviewed slug never resolves.
    $this->getJson('/api/v1/portfolios/bng?locale=bn')->assertNotFound();
});

it('filters portfolios by country', function () {
    portfolio(['country_id' => country('MY')->id]);
    portfolio(['country_id' => country('SA')->id]);

    $this->getJson('/api/v1/portfolios?country=sa')->assertOk()->assertJsonCount(1, 'data');
});

it('hides the logo and link of unverified companies on portfolios', function () {
    $c = company();
    $p = portfolio(['company_id' => $c->id]);

    $this->getJson("/api/v1/portfolios/project-{$p->id}")->assertOk()
        ->assertJsonPath('data.company.name', $c->name)
        ->assertJsonPath('data.company.slug', null)
        ->assertJsonPath('data.company.logo', null);
});

it('never shows stories without consent or review', function () {
    story();
    story(['consent_confirmed_at' => null]);
    story([], reviewed: false);
    story(['status' => PublishStatus::Draft]);

    $this->getJson('/api/v1/success-stories')->assertOk()->assertJsonCount(1, 'data');
});

it('filters success stories by country', function () {
    story(['country_id' => country('MY')->id]);
    story(['country_id' => country('VN')->id]);

    $this->getJson('/api/v1/success-stories?country=VN')->assertOk()->assertJsonCount(1, 'data');
});

it('builds the homepage payload from real data only', function () {
    country('MY');
    portfolio(['is_featured' => true]);

    $this->getJson('/api/v1/home?locale=en')->assertOk()
        ->assertJsonPath('data.intro', null)
        ->assertJsonCount(1, 'data.countries')
        ->assertJsonCount(1, 'data.portfolios')
        ->assertJsonCount(0, 'data.success_stories')
        ->assertJsonCount(0, 'data.partners')
        ->assertJsonPath('data.company_profile_available', false);
});

it('seeds poster content as hidden drafts', function () {
    $this->seed(\Database\Seeders\DatabaseSeeder::class);

    $this->assertDatabaseCount('companies', 4);
    $this->assertDatabaseCount('portfolios', 5);
    $this->getJson('/api/v1/portfolios')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/v1/partners')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/v1/services')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/v1/countries')->assertOk()->assertJsonCount(3, 'data');
});

it('sends security headers', function () {
    $this->getJson('/api/v1/countries')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN');
});

it('applies the general API rate limit', function () {
    foreach (range(1, 120) as $_) {
        $this->getJson('/api/v1/countries')->assertOk();
    }
    $this->getJson('/api/v1/countries')->assertStatus(429);
});

it('sends short cache headers on public reads only', function () {
    $this->getJson('/api/v1/countries')->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300');

    actingAsRole();
    expect($this->getJson('/api/v1/admin/countries')->headers->get('Cache-Control'))->not->toContain('public');
});
