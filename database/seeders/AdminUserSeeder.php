<?php

namespace Database\Seeders;

use App\Support\SuperAdmin;
use Illuminate\Database\Seeder;

/**
 * Ensures the Super Admin from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD exists.
 * Nothing is created when the variables are missing, so no default credentials ever exist.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (SuperAdmin::ensure() === null) {
            $this->command?->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user.');
        }
    }
}
