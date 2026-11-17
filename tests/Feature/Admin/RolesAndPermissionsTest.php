<?php

use App\Enums\PublishStatus;
use App\Models\User;
use App\Support\Permissions;

it('lets a viewer read but not write', function () {
    actingAsRole('viewer');

    $this->getJson('/api/v1/admin/portfolios')->assertOk();
    $this->postJson('/api/v1/admin/portfolios', [])->assertForbidden();
    $this->getJson('/api/v1/admin/users')->assertForbidden();
});

it('lets an editor create drafts but not publish', function () {
    actingAsRole('editor');

    $payload = [
        'status' => PublishStatus::Draft->value,
        'translations' => ['en' => ['title' => 'Draft project', 'slug' => 'draft-project']],
    ];
    $id = $this->postJson('/api/v1/admin/portfolios', $payload)->assertCreated()->json('data.id');

    $this->putJson("/api/v1/admin/portfolios/{$id}", ['status' => 'published'] + $payload)->assertForbidden();
    $this->deleteJson("/api/v1/admin/portfolios/{$id}")->assertForbidden();
});

it('lets an admin publish but not manage users', function () {
    actingAsRole('admin');

    $this->postJson('/api/v1/admin/portfolios', [
        'status' => 'published',
        'translations' => ['en' => ['title' => 'Live', 'slug' => 'live', 'is_reviewed' => true]],
    ])->assertCreated();

    $this->getJson('/api/v1/admin/users')->assertForbidden();
});

it('only lets a super admin grant the super admin role', function () {
    // Give an admin user-management rights via a custom role.
    $actor = actingAsRole('admin');
    $actor->givePermissionTo(['users.view', 'users.create']);

    $this->postJson('/api/v1/admin/users', [
        'name' => 'X', 'email' => 'x@example.test', 'password' => 'Str0ng-Passw0rd', 'roles' => [Permissions::SUPER_ADMIN],
    ])->assertForbidden();
});

it('prevents removing the last super admin', function () {
    $me = actingAsRole(Permissions::SUPER_ADMIN);

    $this->putJson("/api/v1/admin/users/{$me->id}", [
        'name' => $me->name, 'email' => $me->email, 'roles' => ['admin'],
    ])->assertStatus(422);
});

it('creates custom roles with valid permissions only', function () {
    actingAsRole(Permissions::SUPER_ADMIN);

    $this->postJson('/api/v1/admin/roles', ['name' => 'gallery-manager', 'permissions' => ['gallery.view', 'gallery.create']])->assertCreated();
    $this->postJson('/api/v1/admin/roles', ['name' => 'bad', 'permissions' => ['nuke.everything']])->assertStatus(422);
    $this->postJson('/api/v1/admin/roles', ['name' => Permissions::SUPER_ADMIN, 'permissions' => []])->assertStatus(422);
});

it('blocks deactivated users even with a session', function () {
    $user = User::factory()->create(['is_active' => false]);
    $user->assignRole(Permissions::SUPER_ADMIN);
    \Laravel\Sanctum\Sanctum::actingAs($user);

    $this->getJson('/api/v1/admin/me')->assertForbidden();
});
