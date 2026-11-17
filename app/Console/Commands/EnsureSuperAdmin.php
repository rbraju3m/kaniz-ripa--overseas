<?php

namespace App\Console\Commands;

use App\Support\SuperAdmin;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:ensure-super-admin')]
#[Description('Create the configured Super Admin (ADMIN_EMAIL / ADMIN_PASSWORD) if it does not exist')]
class EnsureSuperAdmin extends Command
{
    public function handle(): int
    {
        $result = SuperAdmin::ensure();

        if ($result === null) {
            $this->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set (or database not migrated). Nothing done.');

            return self::FAILURE;
        }

        $this->info(match ($result) {
            'created' => 'Super Admin created: '.config('admin.super_admin.email'),
            'updated' => 'Super Admin re-activated / role restored: '.config('admin.super_admin.email'),
            default => 'Super Admin already present: '.config('admin.super_admin.email'),
        });

        return self::SUCCESS;
    }
}
