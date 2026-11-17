<?php

use App\Services\ProfilePdfService;
use Illuminate\Support\Facades\Storage;

/*
 * Real headless-Chrome render (no fakes). Skipped where Chrome is not installed,
 * e.g. minimal CI images. Run alone with: php artisan test --group=chrome
 */
beforeEach(function () {
    $binary = config('laravel-pdf.chrome.chrome_binary') ?: '/usr/bin/google-chrome';
    if (! is_executable($binary)) {
        $this->markTestSkipped("Chrome not available at {$binary}");
    }
    Storage::fake('local');
    $this->seed(\Database\Seeders\SettingsSeeder::class);
    $this->seed(\Database\Seeders\TaxonomySeeder::class);
});

it('renders a real Bangla A4 PDF with embedded brand fonts', function () {
    $version = app(ProfilePdfService::class)->generate('bn');
    $pdf = Storage::disk('local')->get($version->path);

    expect(substr($pdf, 0, 5))->toBe('%PDF-')
        ->and($version->size)->toBeGreaterThan(20_000)
        // Hind Siliguri is embedded (subset names look like "ABCDEF+HindSiliguri-Regular").
        ->and($pdf)->toContain('HindSiliguri')
        // A4 media box (595 x 842 pt, Chrome reports 595.92 x 842.88).
        ->and((bool) preg_match('#/MediaBox\s*\[\s*0\s+0\s+595\.\d+\s+842\.\d+\s*\]#', $pdf))->toBeTrue();
})->group('chrome');

it('renders the English PDF too', function () {
    $version = app(ProfilePdfService::class)->generate('en');

    expect(substr(Storage::disk('local')->get($version->path), 0, 5))->toBe('%PDF-')
        ->and($version->locale)->toBe('en');
})->group('chrome');
