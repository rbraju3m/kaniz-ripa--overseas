<?php

use App\Enums\PublishStatus;
use App\Models\Company;
use App\Models\Country;
use App\Models\Portfolio;
use App\Models\SuccessStory;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/** Create a user with a role and authenticate them for the API. */
function actingAsRole(string $role = Permissions::SUPER_ADMIN): User
{
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole($role);
    Sanctum::actingAs($user, ['*']);

    return $user;
}

function country(string $iso = 'MY', bool $served = true): Country
{
    $country = Country::query()->firstOrCreate(['iso2' => $iso], ['is_served' => $served]);
    $country->syncTranslations([
        'en' => ['name' => "Country {$iso}", 'is_reviewed' => true],
        'bn' => ['name' => "দেশ {$iso}", 'is_reviewed' => true],
    ]);

    return $country;
}

function portfolio(array $attrs = [], array $translations = []): Portfolio
{
    $portfolio = Portfolio::query()->create($attrs + ['status' => PublishStatus::Published]);
    $slug = 'project-'.$portfolio->id;
    $portfolio->syncTranslations($translations ?: [
        'en' => ['title' => 'Project EN', 'slug' => $slug, 'summary' => 'Summary', 'is_reviewed' => true],
        'bn' => ['title' => 'প্রকল্প', 'slug' => $slug, 'summary' => 'সারাংশ', 'is_reviewed' => true],
    ]);

    return $portfolio->refresh();
}

function company(array $attrs = []): Company
{
    static $n = 0;
    $n++;

    return Company::query()->create($attrs + ['name' => "Company {$n}", 'slug' => "company-{$n}"]);
}

function story(array $attrs = [], bool $reviewed = true): SuccessStory
{
    $story = SuccessStory::query()->create($attrs + ['status' => PublishStatus::Published, 'consent_confirmed_at' => now()]);
    $story->syncTranslations([
        'en' => ['title' => 'Story', 'slug' => 'story-'.$story->id, 'display_name' => 'A. Rahman', 'testimonial' => 'Thanks', 'is_reviewed' => $reviewed],
    ]);

    return $story->refresh();
}

/** Minimal valid one-page PDF bytes. */
function fakePdfBytes(): string
{
    return "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
}
