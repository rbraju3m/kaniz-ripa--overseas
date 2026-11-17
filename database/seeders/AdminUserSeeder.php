<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;

/**
 * Creates the first Super Admin from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD.
 * Nothing is created when the variables are missing, so no default credentials ever exist.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (! $email || ! $password) {
            $this->command?->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user.');

            return;
        }

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            ['name' => env('ADMIN_NAME', 'Super Admin'), 'password' => $password, 'is_active' => true],
        );

        $user->assignRole(Permissions::SUPER_ADMIN);
    }
}
