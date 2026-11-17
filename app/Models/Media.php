<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    protected $table = 'media';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'variants' => 'array',
            'alt' => 'array',
            'size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isPublic(): bool
    {
        return $this->disk === 'public';
    }

    /** Public URL, or null for private files (they must be streamed by a controller). */
    public function url(?string $variant = null): ?string
    {
        if (! $this->isPublic()) {
            return null;
        }

        $path = $variant ? ($this->variants[$variant] ?? $this->path) : $this->path;

        return Storage::disk('public')->url($path);
    }

    /** @return array<string, string> variant name => public URL */
    public function variantUrls(): array
    {
        if (! $this->isPublic()) {
            return [];
        }

        return collect($this->variants ?? [])
            ->map(fn (string $path) => Storage::disk('public')->url($path))
            ->all();
    }

    public function altFor(?string $locale = null): ?string
    {
        $locale ??= app()->getLocale();

        return $this->alt[$locale] ?? $this->alt['en'] ?? null;
    }
}
