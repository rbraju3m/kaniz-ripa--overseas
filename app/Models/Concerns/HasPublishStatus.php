<?php

namespace App\Models\Concerns;

use App\Enums\PublishStatus;
use Illuminate\Database\Eloquent\Builder;

trait HasPublishStatus
{
    public function scopePublished(Builder $query): Builder
    {
        return $query->where($this->qualifyColumn('status'), PublishStatus::Published->value);
    }

    public function isPublished(): bool
    {
        return $this->status === PublishStatus::Published;
    }
}
