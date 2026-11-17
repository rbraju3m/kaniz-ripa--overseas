<?php

use App\Jobs\GenerateCompanyProfilePdf;
use App\Jobs\RegenerateCompanyProfile;
use App\Models\CompanyProfile;
use App\Models\CompanyProfileVersion;
use App\Services\ProfilePdfService;
use Database\Seeders\SettingsSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;

beforeEach(function () {
    Storage::fake('local');
    $this->seed(SettingsSeeder::class);
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

it('offers the download as soon as a PDF exists, unless hidden', function () {
    actingAsRole();
    $this->putJson('/api/v1/admin/company-profile', ['active_source' => 'uploaded'])->assertOk();

    // No PDF yet: nothing to download, and the website hides every profile link.
    $this->getJson('/api/v1/company-profile?locale=en')->assertNotFound();
    $this->getJson('/api/v1/site?locale=en')->assertJsonPath('data.company_profile_available', false);

    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();

    $this->getJson('/api/v1/company-profile?locale=en')->assertOk();
    $this->getJson('/api/v1/site?locale=en')->assertJsonPath('data.company_profile_available', true);
    $this->getJson('/api/v1/admin/company-profile')->assertJsonPath('data.available.en', true);

    // Hidden by the admin: gone from the website even though the file exists.
    $this->putJson('/api/v1/admin/company-profile', ['status' => 'draft'])->assertOk();
    $this->getJson('/api/v1/company-profile/download?locale=en')->assertNotFound();
    $this->getJson('/api/v1/site?locale=en')->assertJsonPath('data.company_profile_available', false);
});

it('serves only the published profile publicly', function () {
    actingAsRole();
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();

    // The active source is still "generated", which has no PDF: not downloadable.
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

    Queue::fake();

    // No generated version exists yet: nothing to serve, and both languages are generated automatically.
    $this->putJson('/api/v1/admin/company-profile', ['active_source' => 'generated'])->assertOk();
    $this->getJson('/api/v1/company-profile/download?locale=en')->assertNotFound();
    Queue::assertPushed(GenerateCompanyProfilePdf::class, 2);
});

it('rebuilds the generated PDF automatically when website content changes', function () {
    config(['company_profile.auto_regenerate' => true]);
    Queue::fake();
    actingAsRole();
    CompanyProfile::current()->update(['active_source' => 'generated']);

    portfolio();

    Queue::assertPushed(RegenerateCompanyProfile::class);
});

it('does not rebuild when the uploaded PDF is the active source', function () {
    config(['company_profile.auto_regenerate' => true]);
    Queue::fake();
    actingAsRole();
    CompanyProfile::current()->update(['active_source' => 'uploaded']);

    portfolio();

    Queue::assertNotPushed(RegenerateCompanyProfile::class);
});

it('regenerates both languages and prunes old automatic versions', function () {
    Pdf::fake();
    config(['company_profile.keep_generated_versions' => 2]);
    CompanyProfile::current()->update(['active_source' => 'generated']);

    foreach (range(1, 3) as $_) {
        (new RegenerateCompanyProfile)->handle(app(ProfilePdfService::class));
    }

    foreach (['bn', 'en'] as $locale) {
        $versions = CompanyProfileVersion::query()->where('source', 'generated')->where('locale', $locale)->get();
        expect($versions)->toHaveCount(2)
            ->and($versions->where('is_current', true))->toHaveCount(1)
            ->and($versions->max('version_no'))->toBe(3);
    }
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

it('changes the public download URL when another PDF becomes current', function () {
    actingAsRole();
    $this->putJson('/api/v1/admin/company-profile', ['active_source' => 'uploaded'])->assertOk();
    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload(), 'locale' => 'en'])->assertCreated();
    $first = $this->getJson('/api/v1/company-profile?locale=en')->json('data.download_url');

    $this->postJson('/api/v1/admin/company-profile/upload', ['file' => pdfUpload('new.pdf'), 'locale' => 'en'])->assertCreated();
    $second = $this->getJson('/api/v1/company-profile?locale=en')->json('data.download_url');

    expect($second)->not->toBe($first);

    // The unversioned URL is never cached; a stale versioned link is not cached long either.
    $this->get('/api/v1/company-profile/download?locale=en')->assertHeader('Cache-Control', 'no-cache, private');
    $this->get(parse_url($first, PHP_URL_PATH).'?'.parse_url($first, PHP_URL_QUERY))->assertHeader('Cache-Control', 'no-cache, private');
    $this->get(parse_url($second, PHP_URL_PATH).'?'.parse_url($second, PHP_URL_QUERY))->assertHeader('Cache-Control', 'max-age=86400, public');
});
