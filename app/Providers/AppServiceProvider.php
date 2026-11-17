<?php

namespace App\Providers;

use App\Support\Permissions;
use App\Support\SuperAdmin;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Console\Events\CommandFinished;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        // Super Admin implicitly has every permission.
        Gate::before(fn ($user) => $user->hasRole(Permissions::SUPER_ADMIN) ? true : null);

        // The configured Super Admin must always exist: recreate it after every successful
        // migrate / migrate:fresh / migrate:refresh run (deploys included). Tests manage their own users.
        if ($this->app->runningInConsole() && ! $this->app->runningUnitTests()) {
            Event::listen(CommandFinished::class, function (CommandFinished $event) {
                if ($event->exitCode === 0
                    && in_array($event->command, ['migrate', 'migrate:fresh', 'migrate:refresh'], true)
                    && ! $event->input->hasParameterOption('--pretend')) {
                    SuperAdmin::ensure();
                }
            });
        }

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ]);
        RateLimiter::for('contact', fn (Request $request) => [
            Limit::perMinute(3)->by($request->ip()),
            Limit::perDay(20)->by($request->ip()),
        ]);
        RateLimiter::for('downloads', fn (Request $request) => Limit::perMinute(30)->by($request->ip()));
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));
    }
}
