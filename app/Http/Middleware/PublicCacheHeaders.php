<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Short browser caching for anonymous public API reads. Admin routes, writes,
 * authenticated users and file downloads keep their own headers.
 */
class PublicCacheHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $cacheable = $request->isMethod('GET')
            && $request->routeIs('api.public.*')
            && ! $request->routeIs('api.public.profile.download')
            && $response->getStatusCode() === 200
            && $request->user() === null;

        if ($cacheable) {
            $response->headers->set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
            $response->headers->set('Vary', 'Accept, X-Locale', false);
        }

        return $response;
    }
}
