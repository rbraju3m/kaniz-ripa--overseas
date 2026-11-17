<?php

use App\Models\User;
use App\Support\Permissions;
use App\Support\SuperAdmin;
use Illuminate\Support\Facades\Hash;

beforeEach(fn () => config(['admin.super_admin' => [
    'name' => 'Owner', 'email' => 'Owner@Example.com', 'password' => 'secret-pass-123',
]]));

it('creates the configured super admin when missing', function () {
    expect(SuperAdmin::ensure())->toBe('created');

    $user = User::where('email', 'owner@example.com')->firstOrFail();
    expect($user->is_active)->toBeTrue()
        ->and($user->hasRole(Permissions::SUPER_ADMIN))->toBeTrue()
        ->and(Hash::check('secret-pass-123', $user->password))->toBeTrue();
});

it('is idempotent and never resets a changed password', function () {
    SuperAdmin::ensure();
    $user = User::where('email', 'owner@example.com')->first();
    $user->update(['password' => 'changed-in-cms-1']);

    expect(SuperAdmin::ensure())->toBe('ok')
        ->and(User::where('email', 'owner@example.com')->count())->toBe(1)
        ->and(Hash::check('changed-in-cms-1', $user->fresh()->password))->toBeTrue();
});

it('restores the role and active flag if they were removed', function () {
    SuperAdmin::ensure();
    $user = User::where('email', 'owner@example.com')->first();
    $user->syncRoles([]);
    $user->forceFill(['is_active' => false])->save();

    expect(SuperAdmin::ensure())->toBe('updated');
    $user->refresh();
    expect($user->is_active)->toBeTrue()->and($user->hasRole(Permissions::SUPER_ADMIN))->toBeTrue();
});

it('accepts a bcrypt hash as the configured password', function () {
    config(['admin.super_admin.password' => Hash::make('hashed-pass-456')]);

    SuperAdmin::ensure();

    expect(Hash::check('hashed-pass-456', User::where('email', 'owner@example.com')->first()->password))->toBeTrue()
        ->and(SuperAdmin::passwordIsHashed())->toBeTrue();
});

it('does nothing without credentials', function () {
    config(['admin.super_admin.password' => null]);

    expect(SuperAdmin::ensure())->toBeNull()->and(User::count())->toBe(0);
});

it('can be run as an artisan command', function () {
    $this->artisan('app:ensure-super-admin')->assertSuccessful();

    expect(User::where('email', 'owner@example.com')->exists())->toBeTrue();
});
