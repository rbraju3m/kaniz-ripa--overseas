@php
    $bn = $locale === 'bn';
    $t = fn (string $bnText, string $enText) => $bn ? $bnText : $enText;
    $section = 0;
    $num = function () use (&$section) { $section++; return str_pad((string) $section, 2, '0', STR_PAD_LEFT); };
@endphp
<!doctype html>
<html lang="{{ $locale }}">
<head>
<meta charset="utf-8">
<title>{{ $siteName }}</title>
<style>
{!! $fonts !!}
:root{--navy:#0B2A5B;--royal:#1D3FA8;--green:#15803D;--mint:#EEF8F2;--mint2:#DDF3E6;--gold:#A8741A;--ink:#0f172a;--muted:#475569;--line:#e2e8f0;}
*{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
{{-- Raw output: Blade's {{ }} would HTML-escape the quotes, which <style> does not decode. --}}
body{font-family:{!! $bn ? "'Hind Siliguri','Inter'" : "'Inter','Hind Siliguri'" !!},sans-serif;color:var(--ink);font-size:10.5pt;line-height:{{ $bn ? '1.75' : '1.6' }};}
h1,h2,h3{font-family:{!! $bn ? "'Hind Siliguri','Plus Jakarta Sans'" : "'Plus Jakarta Sans','Hind Siliguri'" !!},sans-serif;color:var(--navy);line-height:1.25;}
.cover{page-break-after:always;}
.flow > .sec:first-child{margin-top:0;}
@if(!empty($preview)) body{background:#f1f5f9;padding:12px 0;} .cover,.flow{background:#fff;width:210mm;margin:0 auto 12px;box-shadow:0 4px 24px rgba(11,42,91,.12);} .flow{padding:16mm 14mm;} @endif

/* Cover */
.cover{height:263mm;position:relative;overflow:hidden;border-radius:4mm;background:var(--navy);color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:18mm 16mm;}
.cover::before{content:"";position:absolute;right:-60mm;top:-40mm;width:170mm;height:170mm;border-radius:50%;border:22mm solid rgba(255,255,255,.05);}
.cover::after{content:"";position:absolute;left:-30mm;bottom:-50mm;width:120mm;height:120mm;border-radius:50%;background:rgba(21,128,61,.25);}
.cover .brand{display:flex;align-items:center;gap:5mm;position:relative;z-index:1;}
.cover .logo{width:22mm;height:22mm;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cover .logo img{width:100%;height:100%;object-fit:contain;}
.cover .wordmark{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:.14em;font-size:11pt;}
.cover .mid{position:relative;z-index:1;}
.cover .eyebrow{color:#E9C46A;font-weight:600;font-size:{{ $bn ? '11pt' : '9pt' }};margin-bottom:6mm;@if(!$bn)letter-spacing:.2em;text-transform:uppercase;@endif}
.cover h1{color:#fff;font-size:34pt;font-weight:700;margin-bottom:6mm;}
.cover .tagline{font-size:14pt;color:#cbd5e1;max-width:140mm;}
.cover .rule{width:30mm;height:1.6mm;background:var(--gold);border-radius:1mm;margin:8mm 0;}
.cover .foot{position:relative;z-index:1;display:flex;justify-content:space-between;font-size:9pt;color:#cbd5e1;border-top:1px solid rgba(255,255,255,.15);padding-top:6mm;}
.flags{display:flex;gap:3mm;flex-wrap:wrap;margin-top:6mm;}
.flags span{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20mm;padding:1.5mm 4mm;font-size:9pt;}

/* Sections */
.sec{margin-bottom:10mm;break-inside:avoid-page;}
.sec-head{display:flex;align-items:baseline;gap:4mm;margin-bottom:5mm;border-bottom:1px solid var(--line);padding-bottom:3mm;}
.sec-num{font-family:'Plus Jakarta Sans',sans-serif;color:var(--gold);font-weight:700;font-size:11pt;}
.sec-head h2{font-size:18pt;font-weight:700;}
.prose p{margin-bottom:3mm;color:#1e293b;}
.prose ul,.prose ol{margin:0 0 3mm 6mm;}
.lead{font-size:12pt;color:var(--muted);margin-bottom:4mm;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:5mm;}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;}
.card{border:1px solid var(--line);border-radius:3mm;padding:5mm;break-inside:avoid;background:#fff;}
.card h3{font-size:11.5pt;margin-bottom:2mm;}
.card .meta{font-size:8.5pt;color:var(--muted);}
.card.mint{background:var(--mint);border-color:var(--mint2);}
.card.navy{background:var(--navy);color:#fff;border-color:var(--navy);}
.card.navy h3{color:#fff;}
.chip{display:inline-block;background:var(--mint2);color:var(--green);border-radius:10mm;padding:.5mm 3mm;font-size:8pt;font-weight:600;margin-right:1.5mm;}
.pf-cover{width:100%;height:38mm;object-fit:cover;border-radius:2mm;margin-bottom:3mm;}
.partner-logo{height:14mm;max-width:40mm;object-fit:contain;margin-bottom:3mm;}
.quote{font-style:italic;color:#1e293b;border-left:1mm solid var(--gold);padding-left:4mm;margin:2mm 0;}
.person{display:flex;gap:4mm;align-items:center;}
.person img{width:16mm;height:16mm;border-radius:50%;object-fit:cover;}
.contact-row{display:flex;gap:4mm;margin-bottom:3mm;}
.contact-row .k{min-width:30mm;color:var(--muted);font-size:9pt;@if(!$bn)text-transform:uppercase;letter-spacing:.06em;@endif}
.contact-row .v{font-weight:500;}
</style>
</head>
<body>

{{-- 1. Cover --}}
<section class="cover">
    <div class="brand">
        @if($logo)<div class="logo"><img src="{{ $logo }}" alt=""></div>@endif
        <div class="wordmark">KANIZ RIPA OVERSEAS</div>
    </div>
    <div class="mid">
        <div class="eyebrow">{{ $t('কোম্পানি প্রোফাইল', 'Company Profile') }}</div>
        <h1>{{ $siteName }}</h1>
        <div class="rule"></div>
        @if($tagline)<div class="tagline">{{ $tagline }}</div>@endif
        @if($countries->isNotEmpty())
            <div class="flags">@foreach($countries as $c)<span>{{ $c['flag'] }} {{ $c['name'] }}</span>@endforeach</div>
        @endif
    </div>
    <div class="foot">
        <span>{{ $address }}</span>
        <span>{{ $generatedAt->format('F Y') }}</span>
    </div>
</section>

<main class="flow">
    {{-- 2. Company introduction --}}
    @if($p = $pages->get('home_intro'))
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $p['title'] }}</h2></div>
            @if($p['summary'])<p class="lead">{{ $p['summary'] }}</p>@endif
            <div class="prose">{!! $p['body'] !!}</div></div>
    @endif

    {{-- 3. About us (+ history) --}}
    @foreach(['about', 'history'] as $key)
        @if($p = $pages->get($key))
            <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $p['title'] }}</h2></div>
                @if($p['summary'])<p class="lead">{{ $p['summary'] }}</p>@endif
                <div class="prose">{!! $p['body'] !!}</div></div>
        @endif
    @endforeach

    {{-- Team --}}
    @if($team->isNotEmpty())
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $locale === 'bn' ? 'আমাদের টিম' : 'Our Team' }}</h2></div>
            <div class="grid2">
                @foreach($team as $m)
                    <div class="card"><h3>{{ $m['name'] }}</h3>@if($m['role'])<div class="meta">{{ $m['role'] }}</div>@endif @if($m['phone'])<div class="meta">{{ $m['phone'] }}</div>@endif</div>
                @endforeach
            </div></div>
    @endif

    {{-- 4. Mission & vision (+ values) --}}
    @if($pages->has('mission') || $pages->has('vision') || $pages->has('values'))
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('লক্ষ্য ও ভিশন', 'Mission & Vision') }}</h2></div>
            <div class="grid2">
                @foreach(['mission' => 'navy', 'vision' => 'mint'] as $key => $style)
                    @if($p = $pages->get($key))<div class="card {{ $style }}"><h3>{{ $p['title'] }}</h3><div class="prose">{!! $p['body'] !!}</div></div>@endif
                @endforeach
            </div>
            @if($p = $pages->get('values'))
                <div style="margin-top:5mm"><h3 style="margin-bottom:3mm">{{ $p['title'] }}</h3><div class="prose">{!! $p['body'] !!}</div>
                    @if(!empty($p['sections']))<div class="grid3">@foreach($p['sections'] as $s)<div class="card"><h3>{{ $s['title'] }}</h3><div class="meta">{!! $s['body'] !!}</div></div>@endforeach</div>@endif
                </div>
            @endif
        </div>
    @endif

    {{-- 5. Services --}}
    @if($services->isNotEmpty())
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('আমাদের সেবাসমূহ', 'Our Services') }}</h2></div>
            <div class="grid2">@foreach($services as $s)<div class="card"><h3>{{ $s['title'] }}</h3>@if($s['summary'])<div class="meta">{{ $s['summary'] }}</div>@endif</div>@endforeach</div></div>
    @endif

    {{-- 6. Countries --}}
    @if($countries->isNotEmpty())
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('যেসব দেশে আমরা কাজ করি', 'Countries We Serve') }}</h2></div>
            <div class="grid3">@foreach($countries as $c)<div class="card mint"><h3>{{ $c['flag'] }} {{ $c['name'] }}</h3></div>@endforeach</div></div>
    @endif

    {{-- 7. Partners (verified only) --}}
    @if($partners->isNotEmpty())
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('অংশীদার প্রতিষ্ঠান', 'Partner Companies') }}</h2></div>
            <div class="grid3">@foreach($partners as $c)
                <div class="card">@if($c['logo'])<img class="partner-logo" src="{{ $c['logo'] }}" alt="">@endif
                    <h3>{{ $c['name'] }}</h3><div class="meta">{{ collect([$c['industry'], $c['country']])->filter()->implode(' · ') }}</div></div>
            @endforeach</div></div>
    @endif

    {{-- 8. Portfolio --}}
    @if($portfolios->isNotEmpty())
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('পোর্টফোলিও', 'Portfolio') }}</h2></div>
            <div class="grid2">@foreach($portfolios as $p)
                <div class="card">@if($p['cover'])<img class="pf-cover" src="{{ $p['cover'] }}" alt="">@endif
                    <div>@if($p['country'])<span class="chip">{{ $p['country'] }}</span>@endif @if($p['industry'])<span class="chip">{{ $p['industry'] }}</span>@endif</div>
                    <h3 style="margin-top:2mm">{{ $p['title'] }}</h3>
                    <div class="meta">{{ collect([$p['company'], $p['date']])->filter()->implode(' · ') }}</div>
                    @if($p['summary'])<p style="margin-top:2mm;font-size:9.5pt">{{ $p['summary'] }}</p>@endif
                </div>
            @endforeach</div></div>
    @endif

    {{-- 9. Success stories (consented only) --}}
    @if($stories->isNotEmpty())
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('সাফল্যের গল্প', 'Success Stories') }}</h2></div>
            <div class="grid2">@foreach($stories as $s)
                <div class="card"><div class="person">@if($s['photo'])<img src="{{ $s['photo'] }}" alt="">@endif
                    <div><h3>{{ $s['name'] }}</h3><div class="meta">{{ collect([$s['employer'], $s['country']])->filter()->implode(' · ') }}</div></div></div>
                    @if($s['testimonial'])<p class="quote">“{{ $s['testimonial'] }}”</p>@endif
                </div>
            @endforeach</div></div>
    @endif

    {{-- 10. Credentials --}}
    @if(($p = $pages->get('credentials')) || $licenseNumber)
        <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $p['title'] ?? $t('প্রতিষ্ঠানের সনদ', 'Company Credentials') }}</h2></div>
            @if($licenseNumber)<div class="contact-row"><span class="k">{{ $t('লাইসেন্স নং', 'Licence No.') }}</span><span class="v">{{ $licenseNumber }}</span></div>@endif
            @if($p)<div class="prose">{!! $p['body'] !!}</div>@endif
        </div>
    @endif

    {{-- 11–12. Office address & contact --}}
    <div class="sec"><div class="sec-head"><span class="sec-num">{{ $num() }}</span><h2>{{ $t('যোগাযোগ', 'Contact') }}</h2></div>
        <div class="card mint">
            @if($address)<div class="contact-row"><span class="k">{{ $t('অফিস', 'Office') }}</span><span class="v">{{ $address }}</span></div>@endif
            @if($phone)<div class="contact-row"><span class="k">{{ $t('টেলিফোন', 'Telephone') }}</span><span class="v">{{ $phone }}</span></div>@endif
            @foreach($mobiles as $m)
                <div class="contact-row"><span class="k">{{ $t('মোবাইল', 'Mobile') }}</span><span class="v">{{ $m['number'] }} — {{ $m['name'][$locale] ?? '' }} ({{ $m['role'][$locale] ?? '' }})</span></div>
            @endforeach
            @if($email)<div class="contact-row"><span class="k">{{ $t('ইমেইল', 'Email') }}</span><span class="v">{{ $email }}</span></div>@endif
            @if($website)<div class="contact-row"><span class="k">{{ $t('ওয়েবসাইট', 'Website') }}</span><span class="v">{{ preg_replace('#^https?://#', '', $website) }}</span></div>@endif
        </div>
    </div>
</main>
</body>
</html>
