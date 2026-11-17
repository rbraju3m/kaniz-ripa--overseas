<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\ContactMessageStatus;
use App\Http\Requests\Public\StoreContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactController extends PublicController
{
    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        ContactMessage::query()->create([
            ...$request->safe()->except('website'),
            'locale' => app()->getLocale(),
            'ip' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
            'status' => ContactMessageStatus::New,
        ]);

        return response()->json(['message' => __('Thank you. We will contact you soon.')], 201);
    }
}
