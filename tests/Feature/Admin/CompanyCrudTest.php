<?php

use App\Models\Company;

it('creates an unverified company that is never a public partner', function () {
    actingAsRole();

    $this->postJson('/api/v1/admin/companies', [
        'name' => 'Vital Healthcare Sdn Bhd', 'slug' => 'vital-healthcare', 'website_url' => 'https://example.com',
    ])->assertCreated()->assertJsonPath('data.verification_status', 'unverified');

    $this->getJson('/api/v1/partners')->assertOk()->assertJsonCount(0, 'data');
});

it('refuses to display an unverified company as a partner', function () {
    actingAsRole();

    $this->postJson('/api/v1/admin/companies', [
        'name' => 'X', 'slug' => 'x', 'is_partner_displayed' => true,
    ])->assertStatus(422)->assertJsonValidationErrors('is_partner_displayed');
});

it('shows a company publicly once verified and displayed', function () {
    actingAsRole();
    $id = $this->postJson('/api/v1/admin/companies', ['name' => 'Dai Suwon', 'slug' => 'dai-suwon'])->json('data.id');

    $this->putJson("/api/v1/admin/companies/{$id}", [
        'name' => 'Dai Suwon', 'slug' => 'dai-suwon', 'verification_status' => 'verified', 'is_partner_displayed' => true,
    ])->assertOk();

    $this->getJson('/api/v1/partners')->assertOk()->assertJsonPath('data.0.slug', 'dai-suwon');
    $this->getJson('/api/v1/partners/dai-suwon')->assertOk();
});

it('hides the partner again when un-verified', function () {
    actingAsRole();
    $c = company(['verification_status' => 'verified', 'is_partner_displayed' => true]);

    $this->putJson("/api/v1/admin/companies/{$c->id}", ['name' => $c->name, 'slug' => $c->slug, 'verification_status' => 'unverified'])->assertOk();

    expect($c->fresh()->is_partner_displayed)->toBeFalse();
});

it('requires publish permission to verify a company', function () {
    actingAsRole('editor');
    $c = company();

    $this->putJson("/api/v1/admin/companies/{$c->id}", ['name' => $c->name, 'slug' => $c->slug, 'verification_status' => 'verified'])
        ->assertForbidden();
});

it('deletes a company', function () {
    actingAsRole();
    $c = company();
    $this->deleteJson("/api/v1/admin/companies/{$c->id}")->assertNoContent();
    expect(Company::query()->count())->toBe(0);
});
