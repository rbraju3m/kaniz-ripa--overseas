<?php

use App\Models\Media;
use App\Models\Portfolio;

beforeEach(fn () => actingAsRole());

function portfolioPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'status' => 'draft',
        'is_featured' => true,
        'project_date' => '2026-10-28',
        'translations' => [
            'en' => ['title' => 'Factory workers for Malaysia', 'slug' => 'factory-workers-malaysia', 'summary' => 'Summary', 'description' => '<p>Desc</p>', 'is_reviewed' => true],
            'bn' => ['title' => 'মালয়েশিয়ায় কর্মী', 'slug' => 'factory-workers-malaysia', 'is_reviewed' => false],
        ],
    ], $overrides);
}

it('creates a portfolio with translations', function () {
    $country = country('MY');

    $res = $this->postJson('/api/v1/admin/portfolios', portfolioPayload(['country_id' => $country->id]))
        ->assertCreated()
        ->assertJsonPath('data.translations.en.title', 'Factory workers for Malaysia')
        ->assertJsonPath('data.translations.en.is_reviewed', true)
        ->assertJsonPath('data.translations.bn.is_reviewed', false);

    $portfolio = Portfolio::query()->findOrFail($res->json('data.id'));
    expect($portfolio->translation('en')->reviewed_at)->not->toBeNull()
        ->and($portfolio->translation('bn')->reviewed_at)->toBeNull();
});

it('lists, searches and filters portfolios', function () {
    portfolio();
    $this->postJson('/api/v1/admin/portfolios', portfolioPayload())->assertCreated();

    $this->getJson('/api/v1/admin/portfolios')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/api/v1/admin/portfolios?search=Factory')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/admin/portfolios?status=published')->assertOk()->assertJsonCount(1, 'data');
});

it('updates a portfolio and its gallery images', function () {
    $id = $this->postJson('/api/v1/admin/portfolios', portfolioPayload())->json('data.id');
    $media = Media::query()->create(['disk' => 'public', 'path' => 'x.webp', 'original_name' => 'x', 'mime' => 'image/webp', 'size' => 1]);

    $this->putJson("/api/v1/admin/portfolios/{$id}", portfolioPayload([
        'status' => 'published',
        'images' => [['media_id' => $media->id, 'caption' => ['en' => 'Interview day']]],
    ]))->assertOk()->assertJsonPath('data.status', 'published')->assertJsonCount(1, 'data.images');
});

it('rejects duplicate slugs within a locale', function () {
    $this->postJson('/api/v1/admin/portfolios', portfolioPayload())->assertCreated();
    $this->postJson('/api/v1/admin/portfolios', portfolioPayload())
        ->assertStatus(422)
        ->assertJsonValidationErrors(['translations.en.slug']);
});

it('requires a title for every submitted locale', function () {
    $this->postJson('/api/v1/admin/portfolios', ['translations' => ['bn' => ['slug' => 'x']]])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['translations.bn.title']);
});

it('sanitises rich text', function () {
    $id = $this->postJson('/api/v1/admin/portfolios', portfolioPayload([
        'translations' => ['en' => ['description' => '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(1)>']],
    ]))->assertCreated()->json('data.id');

    $html = Portfolio::query()->find($id)->translation('en')->description;
    expect($html)->toContain('<p>ok</p>')->not->toContain('<script')->not->toContain('onerror');
});

it('deletes a portfolio and logs activity', function () {
    $p = portfolio();
    $this->deleteJson("/api/v1/admin/portfolios/{$p->id}")->assertNoContent();

    $this->assertModelMissing($p);
    $this->assertDatabaseHas('activity_log', ['subject_type' => Portfolio::class, 'subject_id' => $p->id, 'event' => 'deleted']);
});
