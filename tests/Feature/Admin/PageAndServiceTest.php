<?php

use App\Models\Page;

beforeEach(fn () => actingAsRole());

it('manages a page and exposes it publicly only when published and reviewed', function () {
    $payload = [
        'key' => 'about', 'status' => 'published',
        'translations' => [
            'en' => ['title' => 'About Us', 'slug' => 'about', 'body' => '<p>Hello</p>', 'is_reviewed' => true],
            'bn' => ['title' => 'আমাদের সম্পর্কে', 'slug' => 'about', 'body' => '<p>হ্যালো</p>', 'is_reviewed' => false],
        ],
    ];
    $id = $this->postJson('/api/v1/admin/pages', $payload)->assertCreated()->json('data.id');

    // BN is unreviewed, so BN visitors get the reviewed EN version.
    $this->getJson('/api/v1/pages/about?locale=bn')->assertOk()->assertJsonPath('data.locale', 'en');

    $payload['translations']['bn']['is_reviewed'] = true;
    $this->putJson("/api/v1/admin/pages/{$id}", $payload)->assertOk();
    $this->getJson('/api/v1/pages/about?locale=bn')->assertOk()->assertJsonPath('data.title', 'আমাদের সম্পর্কে');

    $payload['status'] = 'draft';
    $this->putJson("/api/v1/admin/pages/{$id}", $payload)->assertOk();
    $this->getJson('/api/v1/pages/about')->assertNotFound();
});

it('rejects invalid page keys', function () {
    $this->postJson('/api/v1/admin/pages', ['key' => 'Bad Key!', 'translations' => ['en' => ['title' => 'x', 'slug' => 'x']]])
        ->assertStatus(422)->assertJsonValidationErrors('key');
});

it('manages services', function () {
    $id = $this->postJson('/api/v1/admin/services', [
        'icon' => 'globe', 'status' => 'published',
        'translations' => ['en' => ['title' => 'Recruitment', 'slug' => 'recruitment', 'is_reviewed' => true]],
    ])->assertCreated()->json('data.id');

    $this->getJson('/api/v1/services')->assertOk()->assertJsonPath('data.0.title', 'Recruitment');
    $this->deleteJson("/api/v1/admin/services/{$id}")->assertNoContent();
    $this->getJson('/api/v1/services')->assertOk()->assertJsonCount(0, 'data');
});

it('updates settings and clears placeholder flags', function () {
    $this->seed(\Database\Seeders\SettingsSeeder::class);

    $this->putJson('/api/v1/admin/settings', ['settings' => ['email' => 'info@example.com']])->assertOk();
    $this->assertDatabaseHas('settings', ['key' => 'email', 'is_placeholder' => false]);
    $this->getJson('/api/v1/site')->assertJsonPath('data.settings.contact.email', 'info@example.com');

    $this->putJson('/api/v1/admin/settings', ['settings' => ['email' => 'not-an-email']])->assertStatus(422);
});

it('reports real dashboard counts', function () {
    portfolio();
    portfolio(['status' => 'draft']);
    company();

    $this->getJson('/api/v1/admin/dashboard')->assertOk()
        ->assertJsonPath('data.stats.portfolios_total', 2)
        ->assertJsonPath('data.stats.portfolios_published', 1)
        ->assertJsonPath('data.stats.partners_total', 1)
        ->assertJsonPath('data.stats.partners_displayed', 0);
});

it('manages page sections and exposes only reviewed, active ones', function () {
    $payload = [
        'key' => 'why_choose_us', 'status' => 'published',
        'translations' => ['en' => ['title' => 'Why choose us', 'slug' => 'why-choose-us', 'is_reviewed' => true]],
        'sections' => [
            ['key' => 'licensed', 'icon' => 'shield', 'translations' => ['en' => ['title' => 'Licensed', 'body' => '<p>ok</p><script>x</script>', 'is_reviewed' => true]]],
            ['key' => 'draft-point', 'translations' => ['en' => ['title' => 'Unreviewed', 'is_reviewed' => false]]],
            ['key' => 'hidden', 'is_active' => false, 'translations' => ['en' => ['title' => 'Hidden', 'is_reviewed' => true]]],
        ],
    ];
    $id = $this->postJson('/api/v1/admin/pages', $payload)->assertCreated()->assertJsonCount(3, 'data.sections')->json('data.id');

    $res = $this->getJson('/api/v1/pages/why_choose_us?locale=en')->assertOk()->assertJsonCount(1, 'data.sections');
    expect($res->json('data.sections.0.body'))->not->toContain('<script');

    // Removing a section from the payload deletes it; order follows the payload.
    $payload['sections'] = [$payload['sections'][2], $payload['sections'][0]];
    $this->putJson("/api/v1/admin/pages/{$id}", $payload)->assertOk()
        ->assertJsonCount(2, 'data.sections')
        ->assertJsonPath('data.sections.0.key', 'hidden');
});
