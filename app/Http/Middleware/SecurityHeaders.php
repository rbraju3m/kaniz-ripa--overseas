<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /** Third-party frames the site embeds (videos, office map). */
    private const FRAME_SOURCES = 'https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com';

    public function handle(Request $request, Closure $next): Response
    {
        $csp = (bool) config('app.csp_enabled');
        if ($csp) {
            // Nonce for the inline bootstrap script and Vite tags.
            Vite::useCspNonce();
        }

        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        $isHtml = str_contains((string) $response->headers->get('Content-Type'), 'text/html');
        if ($csp && $isHtml && ! $response->headers->has('Content-Security-Policy')) {
            $nonce = Vite::cspNonce();
            $response->headers->set('Content-Security-Policy', implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'nonce-{$nonce}'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https:",
                "font-src 'self' data:",
                "connect-src 'self'",
                'frame-src '.self::FRAME_SOURCES." 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
            ]));
        }

        return $response;
    }
}
