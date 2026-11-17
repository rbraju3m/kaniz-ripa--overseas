<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SeoMetadata extends Model
{
    use LogsAdminActivity;

    protected $table = 'seo_metadata';

    protected $fillable = [
        'seoable_type', 'seoable_id', 'route_key', 'locale', 'meta_title',
        'meta_description', 'og_image_media_id', 'canonical_url', 'noindex',
    ];

    protected function casts(): array
    {
        return ['noindex' => 'boolean'];
    }

    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }

    public function ogImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'og_image_media_id');
    }
}
