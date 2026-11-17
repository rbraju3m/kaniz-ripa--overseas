<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuccessStoryImage extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['caption' => 'array', 'sort' => 'integer'];
    }

    public function successStory(): BelongsTo
    {
        return $this->belongsTo(SuccessStory::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
