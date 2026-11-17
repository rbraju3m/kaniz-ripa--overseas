<?php

use App\Models\User;
use Database\Seeders\CompanyContentSeeder;
use Database\Seeders\SettingsSeeder;
use Database\Seeders\TaxonomySeeder;

it('publishes about, team, services and partners in both languages', function () {
    $this->seed([TaxonomySeeder::class, SettingsSeeder::class]);
    User::factory()->create(['is_active' => true])->assignRole('super-admin');

    $this->seed(CompanyContentSeeder::class);

    foreach (['bn', 'en'] as $locale) {
        $this->getJson("/api/v1/pages/about?locale={$locale}")->assertOk()->assertJsonPath('data.locale', $locale);
        $this->getJson("/api/v1/pages/management?locale={$locale}")->assertOk();
        $this->getJson("/api/v1/team?locale={$locale}")->assertOk()->assertJsonCount(4, 'data');
        $this->getJson("/api/v1/services?locale={$locale}")->assertOk()->assertJsonCount(5, 'data');
        $this->getJson("/api/v1/partners?locale={$locale}")->assertOk()->assertJsonCount(4, 'data');
    }

    $this->getJson('/api/v1/team?locale=en')->assertJsonPath('data.0.name', 'Moniruzzaman')->assertJsonPath('data.0.role', 'Managing Director');

    // Pages without approved copy stay unpublished.
    $this->getJson('/api/v1/pages/history?locale=en')->assertNotFound();
});
