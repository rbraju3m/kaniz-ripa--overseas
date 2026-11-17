<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Menu::query()->with('items')->get()]);
    }

    /** Replace a menu's items in one call (supports drag-and-drop ordering, one nesting level). */
    public function update(Request $request, int $id): JsonResponse
    {
        $menu = Menu::query()->findOrFail($id);
        $data = $request->validate([
            'items' => ['present', 'array', 'max:50'],
            'items.*.label' => ['required', 'array'],
            'items.*.label.bn' => ['required', 'string', 'max:80'],
            'items.*.label.en' => ['required', 'string', 'max:80'],
            'items.*.route_name' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/'],
            'items.*.url' => ['nullable', 'required_without:items.*.route_name', 'string', 'max:255', 'regex:#^(https?://|/)#'],
            'items.*.open_in_new_tab' => ['sometimes', 'boolean'],
            'items.*.is_active' => ['sometimes', 'boolean'],
            'items.*.children' => ['sometimes', 'array', 'max:20'],
            'items.*.children.*.label.bn' => ['required', 'string', 'max:80'],
            'items.*.children.*.label.en' => ['required', 'string', 'max:80'],
            'items.*.children.*.route_name' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/'],
            'items.*.children.*.url' => ['nullable', 'string', 'max:255', 'regex:#^(https?://|/)#'],
        ]);

        DB::transaction(function () use ($menu, $data) {
            $menu->items()->delete();
            foreach ($data['items'] as $i => $item) {
                $parent = $menu->items()->create($this->attrs($item, $i));
                foreach ($item['children'] ?? [] as $j => $child) {
                    $menu->items()->create($this->attrs($child, $j) + ['parent_id' => $parent->id]);
                }
            }
        });

        return response()->json(['data' => $menu->load('items')]);
    }

    private function attrs(array $item, int $sort): array
    {
        return [
            'label' => $item['label'],
            'route_name' => $item['route_name'] ?? null,
            'url' => $item['url'] ?? null,
            'open_in_new_tab' => (bool) ($item['open_in_new_tab'] ?? false),
            'is_active' => (bool) ($item['is_active'] ?? true),
            'sort' => $sort,
        ];
    }
}
