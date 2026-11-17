<?php

namespace App\Models;

use App\Enums\ProfileSource;
use App\Enums\PublishStatus;
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
            'status' => PublishStatus::Draft,
        ]);
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
