<?php

namespace App\Models;

use App\Enums\VerificationStatus;
use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Company extends Model
{
    use HasTranslations, LogsAdminActivity;

    protected $fillable = [
        'name', 'slug', 'logo_media_id', 'country_id', 'industry_id', 'website_url',
        'verification_status', 'is_partner_displayed', 'is_featured', 'sort', 'internal_note',
    ];

    protected function casts(): array
    {
        return [
            'verification_status' => VerificationStatus::class,
            'is_partner_displayed' => 'boolean',
            'is_featured' => 'boolean',
            'sort' => 'integer',
        ];
    }

    /** Only verified companies the admin chose to display are public partners. */
    public function scopePartners(Builder $query): Builder
    {
        return $query->where('verification_status', VerificationStatus::Verified->value)
            ->where('is_partner_displayed', true);
    }

    public function isPublicPartner(): bool
    {
        return $this->verification_status === VerificationStatus::Verified && $this->is_partner_displayed;
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'logo_media_id');
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function portfolios(): HasMany
    {
        return $this->hasMany(Portfolio::class);
    }

    public function seo(): MorphMany
    {
        return $this->morphMany(SeoMetadata::class, 'seoable');
    }
}
