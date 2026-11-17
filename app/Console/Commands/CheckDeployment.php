<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Post-deploy sanity check. Exit code 1 when anything critical fails,
 * so it can gate a deploy script.
 */
#[Signature('app:check-deployment {--production : Apply production-only rules even if APP_ENV differs}')]
#[Description('Verify the server is correctly configured for Kaniz Ripa Overseas')]
class CheckDeployment extends Command
{
    /** @var list<array{string, string, string}> */
    private array $rows = [];

    public function handle(): int
    {
        $prod = $this->option('production') || app()->isProduction();

        // Application
        $this->check('APP_KEY set', filled(config('app.key')));
        $this->check('APP_DEBUG off', ! config('app.debug'), $prod ? 'fail' : 'warn');
        $this->check('APP_ENV=production', app()->isProduction(), $prod ? 'fail' : 'warn', app()->environment());
        $this->check('APP_URL uses https', str_starts_with((string) config('app.url'), 'https://'), $prod ? 'fail' : 'warn', (string) config('app.url'));

        // Database
        try {
            DB::connection()->getPdo();
            $this->check('Database connection', true, detail: DB::connection()->getDatabaseName());
            Artisan::call('migrate:status', ['--pending' => true]);
            $pending = substr_count(Artisan::output(), 'Pending');
            $this->check('No pending migrations', $pending === 0, detail: $pending ? "{$pending} pending" : '');
            $this->check('Active Super Admin exists', User::role(Permissions::SUPER_ADMIN)->where('is_active', true)->exists());
        } catch (Throwable $e) {
            $this->check('Database connection', false, detail: $e->getMessage());
        }

        // Files
        foreach (['storage/framework', 'storage/logs', 'storage/app/private', 'storage/app/public', 'bootstrap/cache'] as $dir) {
            $this->check("Writable: {$dir}", is_writable(base_path($dir)));
        }
        $this->check('public/storage symlink', is_link(public_path('storage')), detail: 'php artisan storage:link');
        $this->check('Frontend build (Vite manifest)', is_file(public_path('build/manifest.json')), detail: 'npm ci && npm run build');
        $this->check('No Vite dev "hot" file', ! is_file(public_path('hot')), $prod ? 'fail' : 'warn');

        // PDF generation
        $chrome = (string) (config('laravel-pdf.chrome.chrome_binary') ?: '/usr/bin/google-chrome');
        $this->check('Chrome for PDF generation', is_executable($chrome), detail: $chrome);
        $this->check('PDF driver is chrome', config('laravel-pdf.driver') === 'chrome', 'warn', (string) config('laravel-pdf.driver'));

        // Queue (PDF generation runs on the queue)
        $queue = (string) config('queue.default');
        $this->check('Queue is asynchronous', $queue !== 'sync', 'warn', $queue);
        try {
            $failed = DB::table(config('queue.failed.table', 'failed_jobs'))->count();
            $this->check('No failed jobs', $failed === 0, 'warn', $failed ? "{$failed} failed — php artisan queue:failed" : '');
        } catch (Throwable) {
            // failed_jobs table missing is already covered by pending migrations
        }

        // Sessions / auth
        $this->check('Secure session cookie', (bool) config('session.secure'), $prod ? 'fail' : 'warn', 'SESSION_SECURE_COOKIE=true');
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);
        $stateful = (array) config('sanctum.stateful');
        $this->check('Sanctum stateful domain', $host && in_array($host, $stateful, true), $prod ? 'fail' : 'warn', 'SANCTUM_STATEFUL_DOMAINS');
        $this->check('Admin seed password removed from .env', blank(env('ADMIN_PASSWORD')), $prod ? 'fail' : 'warn', 'delete ADMIN_PASSWORD after first seed');

        // Mail & backups
        $this->check('Mail transport configured', ! in_array(config('mail.default'), ['log', 'array'], true), 'warn', (string) config('mail.default'));
        try {
            $disk = Storage::disk('backups');
            $files = collect($disk->allFiles())->filter(fn ($f) => str_ends_with($f, '.zip'));
            $latest = $files->map(fn ($f) => $disk->lastModified($f))->max();
            $fresh = $latest && now()->timestamp - $latest < 2 * 86400;
            $this->check('Recent backup (< 48h)', $fresh, 'warn', $latest ? date('Y-m-d H:i', $latest) : 'none yet — php artisan backup:run');
        } catch (Throwable $e) {
            $this->check('Backup disk', false, 'warn', $e->getMessage());
        }

        $this->table(['Status', 'Check', 'Detail'], $this->rows);
        $fails = collect($this->rows)->where(0, '<fg=red>FAIL</>')->count();
        $warns = collect($this->rows)->where(0, '<fg=yellow>WARN</>')->count();

        $fails ? $this->error("{$fails} critical problem(s), {$warns} warning(s).") : $this->info("All critical checks passed ({$warns} warning(s)).");

        return $fails ? self::FAILURE : self::SUCCESS;
    }

    private function check(string $label, bool $ok, string $severity = 'fail', string $detail = ''): void
    {
        $status = $ok ? '<fg=green>OK</>' : ($severity === 'fail' ? '<fg=red>FAIL</>' : '<fg=yellow>WARN</>');
        $this->rows[] = [$status, $label, $ok && $severity === 'fail' && ! str_contains($label, 'connection') ? '' : $detail];
    }
}
