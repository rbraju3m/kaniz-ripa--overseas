<?php

namespace App\Jobs;

use App\Services\ProfilePdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateCompanyProfilePdf implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 180;

    public function __construct(
        public readonly string $locale,
        public readonly ?int $userId = null,
        public readonly ?string $notes = null,
    ) {}

    public function handle(ProfilePdfService $service): void
    {
        $version = $service->generate($this->locale, $this->userId, $this->notes);

        activity('company_profile')
            ->causedBy($this->userId)
            ->performedOn($version)
            ->withProperties(['locale' => $this->locale, 'version' => $version->version_no])
            ->log('generated');
    }
}
