<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Locale from ?locale=, X-Locale header, or the /{locale}/ URL prefix. Defaults to Bangla. */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $candidate = $request->query('locale')
            ?? $request->header('X-Locale')
            ?? $request->route('locale');

        app()->setLocale(Locale::fromRequestValue(is_string($candidate) ? $candidate : null)->value);

        return $next($request);
    }
}
