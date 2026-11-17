<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ContactMessageStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminResource;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ContactMessageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $messages = ContactMessage::query()
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', (string) $s))
            ->when($request->query('search'), function ($q, $s) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $s).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like)
                    ->orWhere('phone', 'like', $like)->orWhere('subject', 'like', $like));
            })
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 20), 1), 100));

        return AdminResource::collection($messages);
    }

    public function show(int $id): AdminResource
    {
        $message = ContactMessage::query()->findOrFail($id);
        if ($message->status === ContactMessageStatus::New) {
            $message->update(['status' => ContactMessageStatus::Read, 'read_at' => now()]);
        }

        return AdminResource::make($message);
    }

    public function update(Request $request, int $id): AdminResource
    {
        $data = $request->validate(['status' => ['required', Rule::enum(ContactMessageStatus::class)]]);
        $message = ContactMessage::query()->findOrFail($id);
        $message->update($data + ['read_at' => $message->read_at ?? now()]);

        return AdminResource::make($message);
    }

    public function destroy(int $id): JsonResponse
    {
        ContactMessage::query()->findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
