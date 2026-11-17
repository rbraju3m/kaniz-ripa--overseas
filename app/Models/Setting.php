<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use LogsAdminActivity;

    protected $fillable = ['group', 'key', 'value', 'is_translatable', 'is_public', 'is_placeholder', 'note'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'is_translatable' => 'boolean',
            'is_public' => 'boolean',
            'is_placeholder' => 'boolean',
        ];
    }

    /** Value resolved for a locale when the setting is translatable. */
    public function valueFor(?string $locale = null): mixed
    {
        $value = $this->value['v'] ?? null;

        if (! $this->is_translatable || ! is_array($value)) {
            return $value;
        }

        $locale ??= app()->getLocale();

        return $value[$locale] ?? $value['en'] ?? null;
    }
}
