<?php

use App\Support\Permissions;

it('defines module.action permissions', function () {
    expect(Permissions::all())->toContain('portfolios.publish', 'users.delete', 'dashboard.view')
        ->each->toMatch('/^[a-z_]+\.[a-z]+$/');
});

it('keeps user management out of non-super roles', function () {
    $roles = Permissions::defaultRoles();

    foreach (['admin', 'editor', 'viewer'] as $role) {
        expect(collect($roles[$role])->filter(fn ($p) => str_starts_with($p, 'users.') || str_starts_with($p, 'roles.')))->toBeEmpty();
    }
    expect($roles['editor'])->not->toContain('portfolios.publish')
        ->and($roles['viewer'])->each->toEndWith('.view');
});
