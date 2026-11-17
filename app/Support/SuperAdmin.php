<?php

namespace App\Support;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

/**
 * Guarantees the configured Super Admin (config/admin.php) exists, is active and
 * holds the super-admin role. An existing account's password is never reset,
 * so a password changed in the CMS is kept.
 */
class SuperAdmin
{
    /** @return string|null  'created', 'updated', 'ok', or null when skipped */
    public static function ensure(): ?string
    {
        $config = config('admin.super_admin');
        $email = strtolower(trim((string) ($config['email'] ?? '')));
        $password = (string) ($config['password'] ?? '');

        if ($email === '' || $password === '' || ! Schema::hasTable('users') || ! Schema::hasTable('roles')) {
            return null;
        }

        if (! Role::query()->where('name', Permissions::SUPER_ADMIN)->where('guard_name', 'web')->exists()) {
            (new RolesAndPermissionsSeeder)->run();
        }

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            $user = User::query()->create([
                'name' => $config['name'] ?: 'Super Admin',
                'email' => $email,
                // The model's "hashed" cast hashes plain passwords and keeps bcrypt hashes as-is.
                'password' => $password,
                'is_active' => true,
            ]);
            $user->assignRole(Permissions::SUPER_ADMIN);

            return 'created';
        }

        $changed = false;
        if (! $user->is_active) {
            $user->forceFill(['is_active' => true])->save();
            $changed = true;
        }
        if (! $user->hasRole(Permissions::SUPER_ADMIN)) {
            $user->assignRole(Permissions::SUPER_ADMIN);
            $changed = true;
        }

        return $changed ? 'updated' : 'ok';
    }

    public static function passwordIsHashed(): bool
    {
        $password = (string) config('admin.super_admin.password');

        return $password !== '' && Hash::isHashed($password);
    }
}
