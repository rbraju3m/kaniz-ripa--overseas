<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Setting;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Setting::query()->orderBy('group')->orderBy('id')->get()
            ->map(fn (Setting $s) => [
                ...$s->only(['id', 'group', 'key', 'is_translatable', 'is_public', 'is_placeholder', 'note']),
                'value' => $s->value['v'] ?? null,
                // Thumbnail for media settings (logo, default share image).
                'preview_url' => str_ends_with($s->key, '_media_id') && ($s->value['v'] ?? null)
                    ? Media::query()->find($s->value['v'])?->url('sm') : null,
            ])
            ->groupBy('group')]);
    }

    /** Body: { settings: { key: value, ... } } — only existing keys can be updated. */
    public function update(Request $request, SettingsService $service): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.email' => ['nullable', 'email'],
            'settings.facebook_url' => ['nullable', 'url:https'],
            'settings.youtube_url' => ['nullable', 'url:https'],
            'settings.linkedin_url' => ['nullable', 'url:https'],
            'settings.map_embed_url' => ['nullable', 'url:https', 'starts_with:https://www.google.com/maps/embed'],
            'settings.whatsapp_number' => ['nullable', 'regex:/^\+?[0-9]{8,15}$/'],
            'settings.logo_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'settings.default_og_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'settings.phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{6,30}$/'],
            'settings.show_contact_persons' => ['nullable', 'boolean'],
            'settings.show_bismillah' => ['nullable', 'boolean'],
            'settings.mobiles' => ['nullable', 'array', 'max:10'],
            'settings.mobiles.*.number' => ['required', 'string', 'regex:/^\+?[0-9\s-]{8,20}$/'],
            'settings.mobiles.*.name.bn' => ['nullable', 'string', 'max:80'],
            'settings.mobiles.*.name.en' => ['nullable', 'string', 'max:80'],
            'settings.mobiles.*.role.bn' => ['nullable', 'string', 'max:80'],
            'settings.mobiles.*.role.en' => ['nullable', 'string', 'max:80'],
            'settings.mobiles.*.whatsapp' => ['boolean'],
            'settings.*' => ['nullable'],
        ]);

        $settings = Setting::query()->whereIn('key', array_keys($data['settings']))->get()->keyBy('key');

        DB::transaction(function () use ($data, $settings) {
            foreach ($data['settings'] as $key => $value) {
                $setting = $settings->get($key);
                if (! $setting) {
                    continue;
                }
                if (is_string($value)) {
                    $value = strip_tags($value);
                }
                if (is_array($value)) {
                    array_walk_recursive($value, function (&$v) {
                        $v = is_string($v) ? strip_tags($v) : $v;
                    });
                }
                $empty = $value === null || $value === '' || $value === [];
                $setting->update([
                    'value' => ['v' => $value],
                    // A placeholder becomes real once a value is provided.
                    'is_placeholder' => $empty && $setting->is_placeholder,
                ]);
            }
        });

        $service->flush();

        return $this->index();
    }
}
