<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ContactMessageStatus;
use App\Enums\GalleryMediaType;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\ContactMessage;
use App\Models\GalleryMedia;
use App\Models\Portfolio;
use App\Models\Setting;
use App\Models\SuccessStory;
use Illuminate\Http\JsonResponse;
use Spatie\Activitylog\Models\Activity;

/** Every figure comes from the database; nothing is hard-coded. */
class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'stats' => [
                'portfolios_total' => Portfolio::query()->count(),
                'portfolios_published' => Portfolio::query()->published()->count(),
                'partners_total' => Company::query()->count(),
                'partners_displayed' => Company::query()->partners()->count(),
                'success_stories_published' => SuccessStory::query()->publicVisible()->count(),
                'gallery_images' => GalleryMedia::query()->where('type', GalleryMediaType::Image->value)->count(),
                'contact_messages_total' => ContactMessage::query()->count(),
                'contact_messages_new' => ContactMessage::query()->where('status', ContactMessageStatus::New->value)->count(),
            ],
            'missing_information' => Setting::query()->where('is_placeholder', true)->orderBy('group')
                ->get(['key', 'group', 'note']),
            'recent_messages' => ContactMessage::query()->latest('id')->limit(5)
                ->get(['id', 'name', 'subject', 'status', 'created_at']),
            'recent_activity' => Activity::query()->with('causer:id,name')->latest('id')->limit(10)->get()
                ->map(fn (Activity $a) => [
                    'id' => $a->id,
                    'description' => $a->description,
                    'event' => $a->event,
                    'subject_type' => $a->subject_type ? class_basename($a->subject_type) : null,
                    'subject_id' => $a->subject_id,
                    'causer' => $a->causer?->name,
                    'created_at' => $a->created_at?->toIso8601String(),
                ]),
        ]]);
    }
}
