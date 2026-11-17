<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Role::query()->with('permissions:id,name')->withCount('users')->orderBy('id')->get()
                ->map(fn (Role $r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'users_count' => $r->users_count,
                    'is_system' => $r->name === Permissions::SUPER_ADMIN,
                    'permissions' => $r->permissions->pluck('name'),
                ]),
            'modules' => Permissions::MODULES,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions($data['permissions']);

        return response()->json(['data' => $role->load('permissions')], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::query()->findOrFail($id);
        abort_if($role->name === Permissions::SUPER_ADMIN, 422, 'The Super Admin role cannot be modified.');
        $data = $this->validated($request, $role);
        $role->update(['name' => $data['name']]);
        $role->syncPermissions($data['permissions']);

        return response()->json(['data' => $role->load('permissions')]);
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::query()->withCount('users')->findOrFail($id);
        abort_if($role->name === Permissions::SUPER_ADMIN, 422, 'The Super Admin role cannot be deleted.');
        abort_if($role->users_count > 0, 422, 'Reassign users before deleting this role.');
        $role->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request, ?Role $role = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:50', 'regex:/^[a-z0-9-]+$/', Rule::unique('roles', 'name')->ignore($role?->id), Rule::notIn([Permissions::SUPER_ADMIN])],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::in(Permissions::all())],
        ]);
    }
}
