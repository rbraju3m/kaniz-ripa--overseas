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

    <link rel="icon" href="/favicon.ico">
    <script>window.__KRO__ = {!! json_encode($bootstrap, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!};</script>
    @viteReactRefresh
    @vite('resources/js/main.tsx')
</head>
<body class="antialiased">
    <div id="root"></div>
    <noscript>
        <div style="padding:24px;font-family:sans-serif">
            <h1>{{ $meta['title'] }}</h1>
            @if(!empty($meta['description']))<p>{{ $meta['description'] }}</p>@endif
        </div>
    </noscript>
</body>
</html>
