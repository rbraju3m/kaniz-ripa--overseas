<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasTranslations, LogsAdminActivity;

    protected $fillable = ['iso2', 'is_served', 'sort'];

    protected function casts(): array
    {
        return ['is_served' => 'boolean', 'sort' => 'integer'];
    }

    public function scopeServed(Builder $query): Builder
    {
        return $query->where('is_served', true);
    }

    public function portfolios(): HasMany
    {
        return $this->hasMany(Portfolio::class);
    }

    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    public function successStories(): HasMany
    {
        return $this->hasMany(SuccessStory::class);
    }

    /** Unicode flag emoji derived from the ISO code. */
    public function flagEmoji(): string
    {
        return implode('', array_map(
            fn (string $c) => mb_chr(0x1F1E6 + ord($c) - ord('A')),
            str_split(strtoupper($this->iso2))
        ));
    }
}
