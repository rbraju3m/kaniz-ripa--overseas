<?php

namespace App\Models;

use App\Enums\PublishStatus;
use App\Models\Concerns\HasPublishStatus;
use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamMember extends Model
{
    use HasPublishStatus, HasTranslations, LogsAdminActivity;

    protected $fillable = ['photo_media_id', 'phone', 'show_phone', 'whatsapp', 'email', 'status', 'sort'];

    protected function casts(): array
    {
        return [
            'status' => PublishStatus::class,
            'show_phone' => 'boolean',
            'whatsapp' => 'boolean',
            'sort' => 'integer',
        ];
    }

    public function photo(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'photo_media_id');
    }
}
