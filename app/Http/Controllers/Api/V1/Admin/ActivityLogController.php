<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = Activity::query()->with('causer:id,name,email')
            ->when($request->query('log_name'), fn ($q, $n) => $q->where('log_name', (string) $n))
            ->when($request->integer('causer_id'), fn ($q, $id) => $q->where('causer_id', $id))
            ->when($request->query('subject_type'), fn ($q, $t) => $q->where('subject_type', 'like', '%\\'.class_basename((string) $t)))
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 30), 1), 100));

        return response()->json($logs->through(fn (Activity $a) => [
            'id' => $a->id,
            'log_name' => $a->log_name,
            'description' => $a->description,
            'event' => $a->event,
            'subject_type' => $a->subject_type ? class_basename($a->subject_type) : null,
            'subject_id' => $a->subject_id,
            'causer' => $a->causer ? ['id' => $a->causer->id, 'name' => $a->causer->name] : null,
            'changes' => $a->attribute_changes,
            'properties' => $a->properties,
            'created_at' => $a->created_at?->toIso8601String(),
        ]));
    }
}
