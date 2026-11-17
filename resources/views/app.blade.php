<!doctype html>
<html lang="{{ $meta['locale'] ?? 'bn' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0B2A5B">
    <title>{{ $meta['title'] }}</title>
    @if(!empty($meta['description']))<meta name="description" content="{{ $meta['description'] }}">@endif
    @if(!empty($meta['noindex']))<meta name="robots" content="noindex, nofollow">@endif
    @if(!empty($meta['canonical']))<link rel="canonical" href="{{ $meta['canonical'] }}">@endif
    @foreach($meta['alternates'] ?? [] as $hreflang => $href)
        <link rel="alternate" hreflang="{{ $hreflang }}" href="{{ $href }}">
    @endforeach

    {{-- Open Graph / Twitter --}}
    @if(empty($meta['noindex']))
        <meta property="og:site_name" content="Kaniz Ripa Overseas">
        <meta property="og:type" content="{{ $meta['type'] ?? 'website' }}">
        <meta property="og:title" content="{{ $meta['title'] }}">
        @if(!empty($meta['description']))<meta property="og:description" content="{{ $meta['description'] }}">@endif
        @if(!empty($meta['canonical']))<meta property="og:url" content="{{ $meta['canonical'] }}">@endif
        <meta property="og:locale" content="{{ ($meta['locale'] ?? 'bn') === 'bn' ? 'bn_BD' : 'en_US' }}">
        @if(!empty($meta['image']))
            <meta property="og:image" content="{{ $meta['image'] }}">
            <meta name="twitter:card" content="summary_large_image">
        @else
            <meta name="twitter:card" content="summary">
        @endif
        @foreach($meta['jsonLd'] ?? [] as $ld)
            <script type="application/ld+json">{!! json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
        @endforeach
    @endif

    {{-- Preload the fonts used above the fold so they download in parallel with the CSS. --}}
    @php
        $fontPreloads = ($meta['locale'] ?? 'bn') === 'bn'
            ? ['@fontsource/hind-siliguri/files/hind-siliguri-bengali-400-normal.woff2', '@fontsource/hind-siliguri/files/hind-siliguri-bengali-700-normal.woff2']
            : ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2'];
    @endphp
    @if(empty($bootstrap['admin']) && is_file(public_path('build/manifest.json')))
        @if(!empty($pageChunk) && ($chunk = rescue(fn () => \Illuminate\Support\Facades\Vite::asset($pageChunk), null, false)))
            <link rel="modulepreload" href="{{ $chunk }}">
        @endif
        @foreach($fontPreloads as $font)
            @php($href = rescue(fn () => \Illuminate\Support\Facades\Vite::asset('node_modules/'.$font), null, false))
            @if($href)<link rel="preload" href="{{ $href }}" as="font" type="font/woff2" crossorigin>@endif
        @endforeach
    @endif
    <link rel="icon" href="/favicon.ico">
    <script nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">window.__KRO__ = {!! json_encode($bootstrap, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!};</script>
    @viteReactRefresh
    @vite('resources/js/main.tsx')
</head>
<body class="antialiased">
    <div id="root">
        @if(empty($bootstrap['admin']))
            {{-- Static first paint while the app loads; React replaces it on mount. --}}
            <div class="min-h-[100svh] bg-navy-900 pb-20 pt-32 text-white sm:pt-40">
                <div class="container-page">
                    <h1 class="max-w-3xl text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">{{ $meta['heading'] ?? (($bootstrap['site']['settings']['general']['site_name'] ?? null) ?: 'Kaniz Ripa Overseas') }}</h1>
                    @if(!empty($meta['description']))<p class="mt-6 max-w-xl text-lg text-navy-200">{{ \Illuminate\Support\Str::limit($meta['description'], 180) }}</p>@endif
                </div>
            </div>
        @endif
    </div>
    <noscript>
        <div style="padding:24px;font-family:sans-serif">
            <h1>{{ $meta['title'] }}</h1>
            @if(!empty($meta['description']))<p>{{ $meta['description'] }}</p>@endif
        </div>
    </noscript>
</body>
</html>
