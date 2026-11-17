<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $ok = Auth::guard('web')->attempt(
            ['email' => $credentials['email'], 'password' => $credentials['password'], 'is_active' => true],
            (bool) ($credentials['remember'] ?? false),
        );

        if (! $ok) {
            activity('auth')->withProperties(['email' => $credentials['email'], 'ip' => $request->ip()])->log('login_failed');

            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }

        $request->session()->regenerate();
        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->save();
        activity('auth')->causedBy($user)->withProperties(['ip' => $request->ip()])->log('login');

        return response()->json(['data' => UserResource::make($user->load('roles'))]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => UserResource::make($request->user()->load('roles'))]);
    }

    public function logout(Request $request): JsonResponse
    {
        activity('auth')->causedBy($request->user())->log('logout');
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }
}
