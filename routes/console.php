<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled tasks — requires one cron entry on the server:
|   * * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
|--------------------------------------------------------------------------
*/

// Backups: database + uploaded files, then retention cleanup and health check (Bangladesh time).
Schedule::command('backup:clean')->dailyAt('01:30')->timezone('Asia/Dhaka')->onOneServer();
Schedule::command('backup:run')->dailyAt('02:00')->timezone('Asia/Dhaka')->onOneServer()->withoutOverlapping();
Schedule::command('backup:monitor')->dailyAt('09:00')->timezone('Asia/Dhaka')->onOneServer();

// Housekeeping.
Schedule::command('activitylog:clean --days=365')->weekly()->onOneServer();
Schedule::command('queue:prune-failed --hours=720')->weekly();
Schedule::command('sanctum:prune-expired --hours=24')->daily();
