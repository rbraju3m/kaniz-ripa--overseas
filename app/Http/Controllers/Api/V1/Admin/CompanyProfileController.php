<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Locale;
use App\Enums\ProfileSource;
use App\Enums\PublishStatus;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateCompanyProfilePdf;
use App\Models\CompanyProfile;
use App\Models\CompanyProfileVersion;
use App\Services\ProfilePdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CompanyProfileController extends Controller
{
    public function __construct(private readonly ProfilePdfService $pdf) {}

    public function show(): JsonResponse
    {
        $profile = CompanyProfile::current()->load('versions.creator:id,name');

        return response()->json(['data' => [
            ...$profile->only(['id', 'title', 'description']),
            'active_source' => $profile->active_source->value,
            'status' => $profile->status->value,
            'versions' => $profile->versions->map(fn (CompanyProfileVersion $v) => [
                ...$v->only(['id', 'locale', 'original_name', 'size', 'version_no', 'is_current', 'notes']),
                'source' => $v->source->value,
                'created_by' => $v->creator?->name,
                'created_at' => $v->created_at?->toIso8601String(),
            ]),
        ]]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'active_source' => ['sometimes', Rule::enum(ProfileSource::class)],
            'status' => ['sometimes', Rule::enum(PublishStatus::class)],
            'title' => ['sometimes', 'array'],
            'title.bn' => ['nullable', 'string', 'max:190'],
            'title.en' => ['nullable', 'string', 'max:190'],
            'description' => ['sometimes', 'array'],
            'description.bn' => ['nullable', 'string', 'max:1000'],
            'description.en' => ['nullable', 'string', 'max:1000'],
        ]);

        $profile = CompanyProfile::current();
        $publishing = isset($data['status']) && $data['status'] !== $profile->status->value;
        $switching = isset($data['active_source']) && $data['active_source'] !== $profile->active_source->value;
        if ($publishing || ($switching && $profile->isPublished())) {
            Gate::authorize('company_profile.publish');
        }

        if (($data['status'] ?? null) === PublishStatus::Published->value) {
            $source = $data['active_source'] ?? $profile->active_source->value;
            $hasCurrent = $profile->versions()->getQuery()->where('source', $source)->where('is_current', true)->exists();
            abort_unless($hasCurrent, 422, 'Upload or generate a PDF for the selected source before publishing.');
        }

        $profile->update($data);

        return $this->show();
    }

    public function upload(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimetypes:application/pdf', 'extensions:pdf', 'max:20480'],
            'locale' => ['required', Rule::enum(Locale::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $version = $this->pdf->upload($data['file'], $data['locale'], $data['notes'] ?? null, $request->user()->id);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => ['file' => [$e->getMessage()]]], 422);
        }

        activity('company_profile')->causedBy($request->user())->performedOn($version)->log('uploaded');

        return response()->json(['data' => ['id' => $version->id, 'version_no' => $version->version_no]], 201);
    }

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'locales' => ['required', 'array', 'min:1'],
            'locales.*' => [Rule::enum(Locale::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        foreach (array_unique($data['locales']) as $locale) {
            GenerateCompanyProfilePdf::dispatch($locale, $request->user()->id, $data['notes'] ?? null);
        }

        return response()->json(['message' => 'PDF generation queued.'], 202);
    }

    /** HTML preview of the generated layout (renders current published content). */
    public function preview(Request $request): Response
    {
        $locale = Locale::fromRequestValue($request->query('locale'))->value;

        return response($this->pdf->previewHtml($locale))
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Content-Security-Policy', "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:");
    }

    /** Admin download/preview of any version, published or not. */
    public function file(Request $request, int $id): StreamedResponse
    {
        $version = CompanyProfileVersion::query()->findOrFail($id);
        abort_unless(Storage::disk($version->disk)->exists($version->path), 404);

        return Storage::disk($version->disk)->response(
            $version->path,
            "company-profile-{$version->source->value}-{$version->locale}-v{$version->version_no}.pdf",
            ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store'],
            $request->boolean('inline') ? 'inline' : 'attachment',
        );
    }

    public function makeCurrent(int $id): JsonResponse
    {
        $version = CompanyProfileVersion::query()->findOrFail($id);
        if (CompanyProfile::current()->isPublished()) {
            Gate::authorize('company_profile.publish');
        }
        $this->pdf->makeCurrent($version);

        return $this->show();
    }

    public function destroyVersion(int $id): JsonResponse
    {
        $version = CompanyProfileVersion::query()->findOrFail($id);
        $profile = CompanyProfile::current();
        abort_if(
            $version->is_current && $profile->isPublished() && $profile->active_source === $version->source,
            422,
            'This version is currently published. Make another version current first.'
        );
        $this->pdf->delete($version);

        return response()->json(null, 204);
    }
}
