<?php

namespace Tests;

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** Roles and permissions are needed by nearly every feature test. */
    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;
}
