<?php

use App\Jobs\GenerateCompanyProfilePdf;
use App\Models\CompanyProfile;
use App\Models\CompanyProfileVersion;
use App\Services\ProfilePdfService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;

beforeEach(function () {
    Storage::fake('local');
    $this->seed(\Database\Seeders\SettingsSeeder::class);
});

function pdfUpload(string $name = 'profile.pdf'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, fakePdfBytes());
}

it('uploads a PDF to the private disk and versions it', function () {
    actingAsRole();

    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();

    $versions = CompanyProfileVersion::query()->orderBy('version_no')->get();
    expect($versions)->toHaveCount(2)
        ->and($versions[0]->is_current)->toBeFalse()
        ->and($versions[1]->is_current)->toBeTrue()
        ->and($versions[1]->version_no)->toBe(2)
        ->and($versions[1]->disk)->toBe('local');
    Storage::disk('local')->assertExists($versions[1]->path);
});

it('rejects non-PDF uploads even with a .pdf name', function () {
    actingAsRole();
    $fake = UploadedFile::fake()->createWithContent('profile.pdf', '<html>not a pdf</html>');

    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => $fake, 'locale' => 'en'])->assertStatus(422);
    expect(CompanyProfileVersion::query()->count())->toBe(0);
});

it('cannot publish without a current version for the active source', function () {
    actingAsRole();

    $this->putJson('/api/v1/admin/company-profile', ['status' => 'published', 'active_source' => 'uploaded'])->assertStatus(422);
});

it('serves only the published profile publicly', function () {
    actingAsRole();
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();

    // Draft: not downloadable.
    $this->getJson('/api/v1/company-profile/download?locale=en')->assertNotFound();

    $this->putJson('/api/v1/admin/company-profile', ['status' => 'published', 'active_source' => 'uploaded'])->assertOk();

    $this->get('/api/v1/company-profile/download?locale=en')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf');

    // BN visitors fall back to the EN document when no BN version exists.
    $this->getJson('/api/v1/company-profile?locale=bn')->assertOk()->assertJsonPath('data.locale', 'en');
});

it('switches between uploaded and generated sources', function () {
    actingAsRole();
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();
    $this->putJson('/api/v1/admin/company-profile', ['status' => 'published', 'active_source' => 'uploaded'])->assertOk();

    // No generated version exists yet → nothing to serve from that source.
    $this->putJson('/api/v1/admin/company-profile', ['active_source' => 'generated'])->assertOk();
    $this->getJson('/api/v1/company-profile/download?locale=en')->assertNotFound();
});

it('does not expose private profile files through public storage URLs', function () {
    actingAsRole();
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en']);
    $path = CompanyProfileVersion::query()->first()->path;

    expect($this->get('/storage/'.$path)->status())->toBeIn([403, 404]);
    expect($this->get('/storage/app/private/'.$path)->status())->toBeIn([403, 404]);
});

it('queues PDF generation per locale', function () {
    Queue::fake();
    actingAsRole();

    $this->postJson('/api/v1/admin/company-profile/generate', ['locales' => ['bn', 'en']])->assertStatus(202);
    Queue::assertPushed(GenerateCompanyProfilePdf::class, 2);
});

it('generates a PDF version from website content', function () {
    Pdf::fake();
    $version = app(ProfilePdfService::class)->generate('bn');

    expect($version->source->value)->toBe('generated')
        ->and($version->is_current)->toBeTrue()
        ->and(CompanyProfile::query()->count())->toBe(1);

    Pdf::assertSaved(fn ($pdf, string $path) => str_ends_with($path, '.pdf') && $pdf->viewName === 'pdf.profile');
});

it('renders the HTML preview with the company address and no placeholders', function () {
    actingAsRole();

    $this->get('/api/v1/admin/company-profile/preview?locale=bn')
        ->assertOk()
        ->assertSee('বনানী', false)
        ->assertDontSee('[PLACEHOLDER]', false);
});

it('blocks viewers from uploading', function () {
    actingAsRole('viewer');
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertForbidden();
});
