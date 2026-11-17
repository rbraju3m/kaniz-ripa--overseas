<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\UserResource;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()->with('roles')
            ->when($request->query('search'), function ($q, $s) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], (string) $s).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->orderBy('name')->paginate(20);

        return UserResource::collection($users);
    }

    public function show(int $id): UserResource
    {
        return UserResource::make(User::query()->with('roles')->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $user = DB::transaction(function () use ($data) {
            $user = User::query()->create(collect($data)->only(['name', 'email', 'password', 'is_active'])->all());
            $user->syncRoles($data['roles']);

            return $user;
        });

        return UserResource::make($user->load('roles'))->response()->setStatusCode(201);
    }

    public function update(Request $request, int $id): UserResource
    {
        $user = User::query()->findOrFail($id);
        $data = $this->validated($request, $user);
        $this->guardSelfLockout($request, $user, $data);

        DB::transaction(function () use ($user, $data) {
            $user->update(collect($data)->only(['name', 'email', 'is_active'])->all()
                + (! empty($data['password']) ? ['password' => $data['password']] : []));
            $user->syncRoles($data['roles']);
        });

        return UserResource::make($user->load('roles'));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        abort_if($user->is($request->user()), 422, 'You cannot delete your own account.');
        abort_if($user->hasRole(Permissions::SUPER_ADMIN) && ! $request->user()->hasRole(Permissions::SUPER_ADMIN), 403);
        $this->ensureAnotherSuperAdmin($user);
        $user->delete();

        return response()->json(null, 204);
    }

    private function validated(Request $request, ?User $user = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', Password::min(10)->letters()->numbers()->mixedCase()],
            'is_active' => ['sometimes', 'boolean'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::exists('roles', 'name')],
        ]);

        // Only a Super Admin can grant the Super Admin role.
        if (in_array(Permissions::SUPER_ADMIN, $data['roles'], true)) {
            abort_unless($request->user()->hasRole(Permissions::SUPER_ADMIN), 403, 'Only a Super Admin can assign that role.');
        }

        return $data;
    }

    private function guardSelfLockout(Request $request, User $user, array $data): void
    {
        if ($user->is($request->user())) {
            abort_if(array_key_exists('is_active', $data) && ! $data['is_active'], 422, 'You cannot deactivate your own account.');
        }

        if ($user->hasRole(Permissions::SUPER_ADMIN)) {
            abort_unless($request->user()->hasRole(Permissions::SUPER_ADMIN), 403);
            if (! in_array(Permissions::SUPER_ADMIN, $data['roles'], true) || (array_key_exists('is_active', $data) && ! $data['is_active'])) {
                $this->ensureAnotherSuperAdmin($user);
            }
        }
    }

    private function ensureAnotherSuperAdmin(User $user): void
    {
        if (! $user->hasRole(Permissions::SUPER_ADMIN)) {
            return;
        }
        $others = User::role(Permissions::SUPER_ADMIN)->whereKeyNot($user->id)->where('is_active', true)->count();
        abort_if($others === 0, 422, 'At least one active Super Admin must remain.');
    }
}
