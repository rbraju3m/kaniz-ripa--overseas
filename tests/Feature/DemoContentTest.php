<?php

use App\Models\Page;
use App\Models\SuccessStory;
use Database\Seeders\SiteStructureSeeder;
use Database\Seeders\TaxonomySeeder;

beforeEach(fn () => $this->seed([TaxonomySeeder::class, SiteStructureSeeder::class]));

it('adds labelled demo content and removes exactly that again', function () {
    $this->artisan('app:demo-content')->assertSuccessful();

    $this->getJson('/api/v1/success-stories?locale=en')->assertOk()->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.display_name', 'Demo Candidate A');
    $this->getJson('/api/v1/pages/mission?locale=bn')->assertOk();

    // Running twice does not duplicate anything.
    $this->artisan('app:demo-content')->assertSuccessful();
    expect(SuccessStory::count())->toBe(3);

    $this->artisan('app:demo-content', ['--remove' => true])->assertSuccessful();

    expect(SuccessStory::count())->toBe(0);
    $this->getJson('/api/v1/pages/mission?locale=en')->assertNotFound();
    expect(Page::where('key', 'mission')->first()->translations()->where('locale', 'en')->value('title'))->toBe('Our Mission');
});

it('never touches pages edited by a person', function () {
    $this->artisan('app:demo-content')->assertSuccessful();
    $page = Page::where('key', 'vision')->first();
    $page->syncTranslations(['en' => ['title' => 'Our Vision', 'slug' => 'vision', 'body' => '<p>Real approved text.</p>', 'is_reviewed' => true]]);
    $page->translations()->where('locale', 'bn')->delete();

    $this->artisan('app:demo-content', ['--remove' => true])->assertSuccessful();

    $this->getJson('/api/v1/pages/vision?locale=en')->assertOk()->assertJsonPath('data.body', '<p>Real approved text.</p>');
});

it('refuses to run in production', function () {
    app()->detectEnvironment(fn () => 'production');

    $this->artisan('app:demo-content')->assertFailed();
    expect(SuccessStory::count())->toBe(0);
});
