<?php

use App\Models\User;
use App\Support\Permissions;

function loginHeaders(): array
{
    return ['Referer' => 'http://localhost', 'Accept' => 'application/json'];
}

it('logs in an active admin and returns permissions', function () {
    $user = User::factory()->create(['email' => 'admin@example.test', 'password' => 'Secret-Pass-123', 'is_active' => true]);
    $user->assignRole('editor');

    $this->withHeaders(loginHeaders())
        ->postJson('/api/v1/admin/login', ['email' => 'admin@example.test', 'password' => 'Secret-Pass-123'])
        ->assertOk()
        ->assertJsonPath('data.email', 'admin@example.test')
        ->assertJsonPath('data.roles.0', 'editor');

    expect($user->fresh()->last_login_at)->not->toBeNull();
    $this->assertAuthenticatedAs($user, 'web');
});

it('rejects wrong passwords and logs the failure', function () {
    User::factory()->create(['email' => 'admin@example.test', 'password' => 'Secret-Pass-123']);

    $this->withHeaders(loginHeaders())
        ->postJson('/api/v1/admin/login', ['email' => 'admin@example.test', 'password' => 'wrong'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');

    $this->assertDatabaseHas('activity_log', ['log_name' => 'auth', 'description' => 'login_failed']);
});

it('rejects deactivated accounts', function () {
    User::factory()->create(['email' => 'off@example.test', 'password' => 'Secret-Pass-123', 'is_active' => false]);

    $this->withHeaders(loginHeaders())
        ->postJson('/api/v1/admin/login', ['email' => 'off@example.test', 'password' => 'Secret-Pass-123'])
        ->assertStatus(422);
});

it('rate limits login attempts', function () {
    User::factory()->create(['email' => 'admin@example.test', 'password' => 'Secret-Pass-123']);

    foreach (range(1, 5) as $_) {
        $this->withHeaders(loginHeaders())->postJson('/api/v1/admin/login', ['email' => 'admin@example.test', 'password' => 'x']);
    }

    $this->withHeaders(loginHeaders())
        ->postJson('/api/v1/admin/login', ['email' => 'admin@example.test', 'password' => 'x'])
        ->assertStatus(429);
});

it('requires authentication for admin endpoints', function () {
    $this->getJson('/api/v1/admin/me')->assertUnauthorized();
    $this->getJson('/api/v1/admin/portfolios')->assertUnauthorized();
});

it('returns the current user', function () {
    actingAsRole(Permissions::SUPER_ADMIN);

    $this->getJson('/api/v1/admin/me')
        ->assertOk()
        ->assertJsonPath('data.is_super_admin', true);
});
