<?php

use App\Http\Controllers\Web\SitemapController;
use App\Http\Controllers\Web\SpaController;
use Illuminate\Support\Facades\Route;

Route::get('/', [SpaController::class, 'root']);
Route::get('sitemap.xml', [SitemapController::class, 'sitemap']);
Route::get('robots.txt', [SitemapController::class, 'robots']);

Route::get('admin/{any?}', [SpaController::class, 'admin'])->where('any', '.*')->name('admin.spa');

Route::get('{locale}/{section?}/{slug?}', [SpaController::class, 'public'])
    ->where(['locale' => 'bn|en', 'section' => '[a-z-]+', 'slug' => '[^/]+'])
    ->name('spa');
