<?php

namespace App\Jobs;

use App\Enums\Locale;
use App\Enums\ProfileSource;
use App\Models\CompanyProfile;
use App\Models\CompanyProfileVersion;
use App\Services\ProfilePdfService;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Rebuilds the generated BN + EN profile PDFs after website content changed.
 * Unique until it starts, so a burst of edits queues a single rebuild, while an
 * edit made during a rebuild still schedules the next one.
 */
class RegenerateCompanyProfile implements ShouldBeUniqueUntilProcessing, ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 300;

    public int $uniqueFor = 900;

    public function uniqueId(): string
    {
        return 'company-profile-regenerate';
    }

    public function handle(ProfilePdfService $service): void
    {
        $profile = CompanyProfile::current();
        if ($profile->active_source !== ProfileSource::Generated) {
            return;
        }

        foreach (Locale::values() as $locale) {
            $version = $service->generate($locale, null, 'Automatic update after website content changed');
            activity('company_profile')->performedOn($version)
                ->withProperties(['locale' => $locale, 'version' => $version->version_no, 'automatic' => true])
                ->log('generated');

            $this->prune($service, $profile, $locale);
        }
    }

    private function prune(ProfilePdfService $service, CompanyProfile $profile, string $locale): void
    {
        $keep = max(1, (int) config('company_profile.keep_generated_versions', 5));

        CompanyProfileVersion::query()
            ->where('company_profile_id', $profile->id)
            ->where('source', ProfileSource::Generated->value)
            ->where('locale', $locale)
            ->where('is_current', false)
            ->orderByDesc('id')
            ->skip($keep - 1)
            ->take(PHP_INT_MAX)
            ->get()
            ->each(fn (CompanyProfileVersion $old) => $service->delete($old));
    }
}
