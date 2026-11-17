<?php

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\Public;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| Public endpoints are read-only and return only published, reviewed content.
| Locale: ?locale=bn|en or X-Locale header (default bn).
| Admin endpoints use Sanctum SPA cookie auth + "module.action" permissions.
*/

Route::prefix('v1')->name('api.')->group(function () {

    // ---------------------------------------------------------------- Public
    Route::name('public.')->group(function () {
        Route::get('site', [Public\SiteController::class, 'show'])->name('site');
        Route::get('home', Public\HomeController::class)->name('home');
        Route::get('countries', [Public\SiteController::class, 'countries'])->name('countries');
        Route::get('industries', [Public\SiteController::class, 'industries'])->name('industries');
        Route::get('pages/{key}', [Public\PageController::class, 'show'])->where('key', '[a-z_]+')->name('pages.show');

        Route::get('team', [Public\TeamController::class, 'index'])->name('team.index');
        Route::get('services', [Public\ServiceController::class, 'index'])->name('services.index');
        Route::get('services/{slug}', [Public\ServiceController::class, 'show'])->name('services.show');
        Route::get('portfolios', [Public\PortfolioController::class, 'index'])->name('portfolios.index');
        Route::get('portfolios/{slug}', [Public\PortfolioController::class, 'show'])->name('portfolios.show');
        Route::get('partners', [Public\PartnerController::class, 'index'])->name('partners.index');
        Route::get('partners/{slug}', [Public\PartnerController::class, 'show'])->name('partners.show');
        Route::get('success-stories', [Public\SuccessStoryController::class, 'index'])->name('stories.index');
        Route::get('success-stories/{slug}', [Public\SuccessStoryController::class, 'show'])->name('stories.show');
        Route::get('gallery/categories', [Public\GalleryController::class, 'categories'])->name('gallery.categories');
        Route::get('gallery', [Public\GalleryController::class, 'index'])->name('gallery.index');

        Route::get('company-profile', [Public\CompanyProfileController::class, 'show'])->name('profile.show');
        Route::get('company-profile/download', [Public\CompanyProfileController::class, 'download'])
            ->middleware('throttle:downloads')->name('profile.download');

        Route::post('contact', [Public\ContactController::class, 'store'])->middleware('throttle:contact')->name('contact.store');
    });

    // ----------------------------------------------------------------- Admin
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::post('login', [Admin\AuthController::class, 'login'])->middleware('throttle:login')->name('login');

        Route::middleware(['auth:sanctum', 'active'])->group(function () {
            Route::get('me', [Admin\AuthController::class, 'me'])->name('me');
            Route::post('logout', [Admin\AuthController::class, 'logout'])->name('logout');

            Route::get('dashboard', Admin\DashboardController::class)->middleware('permission:dashboard.view')->name('dashboard');
            Route::get('reference', Admin\ReferenceController::class)->name('reference');

            // Standard CRUD modules: uri => [controller, permission module]
            $crud = [
                'pages' => [Admin\PageController::class, 'pages'],
                'services' => [Admin\ServiceController::class, 'services'],
                'portfolios' => [Admin\PortfolioController::class, 'portfolios'],
                'companies' => [Admin\CompanyController::class, 'companies'],
                'success-stories' => [Admin\SuccessStoryController::class, 'success_stories'],
                'gallery-categories' => [Admin\GalleryCategoryController::class, 'gallery'],
                'gallery-items' => [Admin\GalleryMediaController::class, 'gallery'],
                'countries' => [Admin\CountryController::class, 'countries'],
                'team-members' => [Admin\TeamMemberController::class, 'team'],
            ];

            foreach ($crud as $uri => [$controller, $module]) {
                Route::get($uri, [$controller, 'index'])->middleware("permission:{$module}.view")->name("{$uri}.index");
                Route::post($uri, [$controller, 'store'])->middleware("permission:{$module}.create")->name("{$uri}.store");
                Route::get("{$uri}/{id}", [$controller, 'show'])->whereNumber('id')->middleware("permission:{$module}.view")->name("{$uri}.show");
                Route::put("{$uri}/{id}", [$controller, 'update'])->whereNumber('id')->middleware("permission:{$module}.update")->name("{$uri}.update");
                Route::patch("{$uri}/{id}/status", [$controller, 'status'])->whereNumber('id')->middleware("permission:{$module}.update")->name("{$uri}.status");
                Route::patch("{$uri}/{id}/toggle", [$controller, 'toggle'])->whereNumber('id')->middleware("permission:{$module}.update")->name("{$uri}.toggle");
                Route::delete("{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id')->middleware("permission:{$module}.delete")->name("{$uri}.destroy");
            }

            // Media library
            Route::get('media', [Admin\MediaController::class, 'index'])->middleware('permission:media.view')->name('media.index');
            Route::post('media', [Admin\MediaController::class, 'store'])->middleware(['permission:media.create', 'throttle:60,1'])->name('media.store');
            Route::put('media/{id}', [Admin\MediaController::class, 'update'])->whereNumber('id')->middleware('permission:media.update')->name('media.update');
            Route::delete('media/{id}', [Admin\MediaController::class, 'destroy'])->whereNumber('id')->middleware('permission:media.delete')->name('media.destroy');

            // Company profile PDF
            Route::prefix('company-profile')->name('profile.')->group(function () {
                Route::get('/', [Admin\CompanyProfileController::class, 'show'])->middleware('permission:company_profile.view')->name('show');
                Route::put('/', [Admin\CompanyProfileController::class, 'update'])->middleware('permission:company_profile.update')->name('update');
                Route::post('upload', [Admin\CompanyProfileController::class, 'upload'])->middleware('permission:company_profile.create')->name('upload');
                Route::post('generate', [Admin\CompanyProfileController::class, 'generate'])->middleware(['permission:company_profile.create', 'throttle:10,1'])->name('generate');
                Route::get('preview', [Admin\CompanyProfileController::class, 'preview'])->middleware('permission:company_profile.view')->name('preview');
                Route::get('versions/{id}/file', [Admin\CompanyProfileController::class, 'file'])->whereNumber('id')->middleware('permission:company_profile.view')->name('versions.file');
                Route::post('versions/{id}/current', [Admin\CompanyProfileController::class, 'makeCurrent'])->whereNumber('id')->middleware('permission:company_profile.update')->name('versions.current');
                Route::delete('versions/{id}', [Admin\CompanyProfileController::class, 'destroyVersion'])->whereNumber('id')->middleware('permission:company_profile.delete')->name('versions.destroy');
            });

            // Contact messages
            Route::get('contact-messages', [Admin\ContactMessageController::class, 'index'])->middleware('permission:contact_messages.view')->name('messages.index');
            Route::get('contact-messages/{id}', [Admin\ContactMessageController::class, 'show'])->whereNumber('id')->middleware('permission:contact_messages.view')->name('messages.show');
            Route::put('contact-messages/{id}', [Admin\ContactMessageController::class, 'update'])->whereNumber('id')->middleware('permission:contact_messages.update')->name('messages.update');
            Route::delete('contact-messages/{id}', [Admin\ContactMessageController::class, 'destroy'])->whereNumber('id')->middleware('permission:contact_messages.delete')->name('messages.destroy');

            // Navigation, SEO, settings
            Route::get('menus', [Admin\MenuController::class, 'index'])->middleware('permission:menus.view')->name('menus.index');
            Route::put('menus/{id}', [Admin\MenuController::class, 'update'])->whereNumber('id')->middleware('permission:menus.update')->name('menus.update');
            Route::get('seo', [Admin\SeoController::class, 'index'])->middleware('permission:seo.view')->name('seo.index');
            Route::put('seo', [Admin\SeoController::class, 'upsert'])->middleware('permission:seo.update')->name('seo.upsert');
            Route::get('settings', [Admin\SettingsController::class, 'index'])->middleware('permission:settings.view')->name('settings.index');
            Route::put('settings', [Admin\SettingsController::class, 'update'])->middleware('permission:settings.update')->name('settings.update');

            // Users, roles, activity
            Route::get('users', [Admin\UserController::class, 'index'])->middleware('permission:users.view')->name('users.index');
            Route::post('users', [Admin\UserController::class, 'store'])->middleware('permission:users.create')->name('users.store');
            Route::get('users/{id}', [Admin\UserController::class, 'show'])->whereNumber('id')->middleware('permission:users.view')->name('users.show');
            Route::put('users/{id}', [Admin\UserController::class, 'update'])->whereNumber('id')->middleware('permission:users.update')->name('users.update');
            Route::delete('users/{id}', [Admin\UserController::class, 'destroy'])->whereNumber('id')->middleware('permission:users.delete')->name('users.destroy');
            Route::get('roles', [Admin\RoleController::class, 'index'])->middleware('permission:roles.view')->name('roles.index');
            Route::post('roles', [Admin\RoleController::class, 'store'])->middleware('permission:roles.create')->name('roles.store');
            Route::put('roles/{id}', [Admin\RoleController::class, 'update'])->whereNumber('id')->middleware('permission:roles.update')->name('roles.update');
            Route::delete('roles/{id}', [Admin\RoleController::class, 'destroy'])->whereNumber('id')->middleware('permission:roles.delete')->name('roles.destroy');
            Route::get('activity-logs', [Admin\ActivityLogController::class, 'index'])->middleware('permission:activity_logs.view')->name('activity.index');
        });
    });
});
