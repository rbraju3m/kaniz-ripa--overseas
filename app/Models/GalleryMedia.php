<?php

namespace App\Models;

use App\Enums\GalleryMediaType;
use App\Enums\PublishStatus;
use App\Models\Concerns\HasPublishStatus;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GalleryMedia extends Model
{
    use HasPublishStatus, LogsAdminActivity;

    protected $table = 'gallery_media';

    protected $fillable = ['gallery_category_id', 'type', 'media_id', 'video_url', 'title', 'status', 'sort'];

    protected function casts(): array
    {
        return [
            'type' => GalleryMediaType::class,
            'status' => PublishStatus::class,
            'title' => 'array',
            'sort' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(GalleryCategory::class, 'gallery_category_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
