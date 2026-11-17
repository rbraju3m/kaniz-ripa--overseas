<?php

use App\Models\Company;
use App\Models\User;
use Database\Seeders\PublishPosterPortfoliosSeeder;
use Database\Seeders\TaxonomySeeder;

it('publishes the poster portfolios in both languages without verifying any partner', function () {
    $this->seed(TaxonomySeeder::class);
    User::factory()->create(['is_active' => true])->assignRole('super-admin');

    $this->seed(PublishPosterPortfoliosSeeder::class);

    foreach (['bn', 'en'] as $locale) {
        $data = $this->getJson("/api/v1/portfolios?locale={$locale}")->assertOk()->json('data');
        expect($data)->toHaveCount(5)
            ->and(collect($data)->pluck('locale')->unique()->all())->toBe([$locale])
            ->and(collect($data)->pluck('company.slug')->filter()->all())->toBe([]);
    }

    expect(Company::query()->partners()->count())->toBe(0);
    $this->getJson('/api/v1/partners')->assertOk()->assertJsonCount(0, 'data');
});

it('publishes nothing without an active super admin', function () {
    $this->seed(TaxonomySeeder::class);

    $this->seed(PublishPosterPortfoliosSeeder::class);

    $this->getJson('/api/v1/portfolios?locale=en')->assertOk()->assertJsonCount(0, 'data');
});
