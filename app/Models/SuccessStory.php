<?php

namespace App\Models;

use App\Enums\PublishStatus;
use App\Models\Concerns\HasPublishStatus;
use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SuccessStory extends Model
{
    use HasPublishStatus, HasTranslations, LogsAdminActivity;

    protected $fillable = [
        'photo_media_id', 'country_id', 'company_id', 'industry_id', 'video_url',
        'is_featured', 'status', 'consent_confirmed_at', 'consent_confirmed_by', 'consent_note', 'sort',
    ];

    protected function casts(): array
    {
        return [
            'status' => PublishStatus::class,
            'is_featured' => 'boolean',
            'consent_confirmed_at' => 'datetime',
            'sort' => 'integer',
        ];
    }

    /** Public stories must be published AND have recorded consent. */
    public function scopePublicVisible(Builder $query): Builder
    {
        return $query->published()->whereNotNull('consent_confirmed_at');
    }

    public function hasConsent(): bool
    {
        return $this->consent_confirmed_at !== null;
    }

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(SuccessStoryImage::class)->orderBy('sort');
    }

    public function seo(): MorphMany
    {
        return $this->morphMany(SeoMetadata::class, 'seoable');
    }
}
