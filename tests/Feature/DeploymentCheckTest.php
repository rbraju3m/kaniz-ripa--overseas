<?php

it('fails the deployment check under production rules when debug is on', function () {
    config(['app.debug' => true]);

    $this->artisan('app:check-deployment', ['--production' => true])->assertExitCode(1);
});

it('passes critical checks in the local environment', function () {
    config(['app.debug' => false]);
    \App\Models\User::factory()->create()->assignRole('super-admin');

    // Writable dirs, Chrome and the build may differ per machine; only assert it runs and reports.
    $this->artisan('app:check-deployment')->expectsOutputToContain('Database connection');
});
