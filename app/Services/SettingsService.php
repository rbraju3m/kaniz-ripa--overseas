<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    private const CACHE_KEY = 'settings.all';

    /** @return \Illuminate\Support\Collection<string, Setting> */
    public function all()
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => Setting::query()->get()->keyBy('key'));
    }

    public function get(string $key, mixed $default = null, ?string $locale = null): mixed
    {
        $setting = $this->all()->get($key);

        return $setting ? ($setting->valueFor($locale) ?? $default) : $default;
    }

    /** Public, non-placeholder settings resolved for the current locale, grouped. */
    public function publicPayload(): array
    {
        return $this->all()
            ->filter(fn (Setting $s) => $s->is_public && ! $s->is_placeholder)
            ->groupBy('group')
            ->map(fn ($items) => $items->mapWithKeys(fn (Setting $s) => [$s->key => $s->valueFor()]))
            ->toArray();
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
