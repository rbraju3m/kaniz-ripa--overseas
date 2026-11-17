<?php

/*
 * The guaranteed Super Admin account. It is created automatically after every
 * `php artisan migrate` (and by `app:ensure-super-admin` / the seeder) when it
 * does not exist yet. Credentials come only from the environment, never from code.
 *
 * ADMIN_PASSWORD may be a plain password or a bcrypt hash ($2y$...). Use a hash
 * in production so no plain password stays on the server:
 *   php -r 'echo password_hash("your-password", PASSWORD_BCRYPT, ["cost" => 12]), PHP_EOL;'
 */
return [
    'super_admin' => [
        'name' => env('ADMIN_NAME', 'Super Admin'),
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],
];
