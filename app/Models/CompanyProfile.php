<?php

namespace App\Models;

use App\Enums\Locale;
use App\Enums\ProfileSource;
use App\Enums\PublishStatus;
use App\Jobs\RegenerateCompanyProfile;
use App\Models\Concerns\HasPublishStatus;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyProfile extends Model
{
    use HasPublishStatus, LogsAdminActivity;

    protected $fillable = ['active_source', 'status', 'title', 'description'];

    protected function casts(): array
    {
        return [
            'active_source' => ProfileSource::class,
            'status' => PublishStatus::class,
            'title' => 'array',
            'description' => 'array',
        ];
    }

    /** The profile is a singleton row. */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'active_source' => ProfileSource::Generated,
            // Visible by default: visitors can download as soon as a PDF exists for the active source.
            'status' => PublishStatus::Published,
        ]);
    }

    /** True when visitors can download a PDF: shown on the website and a current file exists. */
    public function isAvailable(?string $locale = null): bool
    {
        return $this->isPublished() && $this->activeVersion($locale ?? app()->getLocale()) !== null;
    }

    public static function availableForVisitors(): bool
    {
        return (bool) static::query()->first()?->isAvailable();
    }

    /** Locales that have no current generated PDF yet. */
    public function missingGeneratedLocales(): array
    {
        $have = $this->versions()->getQuery()
            ->where('source', ProfileSource::Generated->value)->where('is_current', true)
            ->pluck('locale')->all();

        return array_values(array_diff(Locale::values(), $have));
    }

    /** Queue a debounced rebuild of the generated PDFs (no-op unless the source is "generated"). */
    public static function scheduleRegeneration(): void
    {
        if (! config('company_profile.auto_regenerate')) {
            return;
        }
        $profile = static::query()->first();
        if (! $profile || $profile->active_source !== ProfileSource::Generated) {
            return;
        }

        RegenerateCompanyProfile::dispatch()
            ->delay(now()->addSeconds((int) config('company_profile.regenerate_delay', 60)))
            ->afterCommit();
    }

    public function versions(): HasMany
    {
        return $this->hasMany(CompanyProfileVersion::class)->latest('id');
    }

    /** Current version for the active source in a locale (falls back to EN, then any locale). */
    public function activeVersion(string $locale): ?CompanyProfileVersion
    {
        $base = $this->versions()->getQuery()
            ->where('source', $this->active_source->value)
            ->where('is_current', true);

        return (clone $base)->where('locale', $locale)->first()
            ?? (clone $base)->where('locale', 'en')->first()
            ?? (clone $base)->first();
    }
}
