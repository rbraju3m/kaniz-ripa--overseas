import type { Country } from '@/lib/types';

/** Approximate capital coordinates [lon, lat] for common destination countries. */
const COORDS: Record<string, [number, number]> = {
    SA: [46.7, 24.7], MY: [101.7, 3.1], VN: [105.8, 21.0], AE: [54.4, 24.5], QA: [51.5, 25.3], KW: [48.0, 29.4],
    OM: [58.4, 23.6], BH: [50.6, 26.2], JO: [35.9, 31.9], SG: [103.8, 1.35], JP: [139.7, 35.7], KR: [127.0, 37.6],
    MV: [73.5, 4.2], BN: [114.9, 4.9], LB: [35.5, 33.9], IQ: [44.4, 33.3], CN: [116.4, 39.9], TH: [100.5, 13.8],
    RO: [26.1, 44.4], PL: [21.0, 52.2], HR: [16.0, 45.8], RS: [20.5, 44.8], HU: [19.0, 47.5], GR: [23.7, 38.0],
    IT: [12.5, 41.9], GB: [-0.1, 51.5], MU: [57.5, -20.2], LY: [13.2, 32.9], EG: [31.2, 30.0],
};
const DHAKA: [number, number] = [90.4, 23.8];

const W = 480, H = 340, PAD_X = 70, PAD_TOP = 90, PAD_BOTTOM = 50;

/** Equirectangular projection fitted to Dhaka + the served destinations, so routes stay legible on phones. */
function makeProjection(coords: [number, number][]) {
    const lons = coords.map((c) => c[0]), lats = coords.map((c) => c[1]);
    let lon0 = Math.min(...lons), lon1 = Math.max(...lons), lat0 = Math.min(...lats), lat1 = Math.max(...lats);
    // Keep a sensible minimum span so a single destination isn't absurdly zoomed.
    if (lon1 - lon0 < 30) { const m = (lon0 + lon1) / 2; lon0 = m - 15; lon1 = m + 15; }
    if (lat1 - lat0 < 16) { const m = (lat0 + lat1) / 2; lat0 = m - 8; lat1 = m + 8; }
    const sx = (W - PAD_X * 2) / (lon1 - lon0), sy = (H - PAD_TOP - PAD_BOTTOM) / (lat1 - lat0);
    const k = Math.min(sx, sy);
    const ox = (W - (lon1 - lon0) * k) / 2, oy = PAD_TOP + (H - PAD_TOP - PAD_BOTTOM - (lat1 - lat0) * k) / 2;
    return ([lon, lat]: [number, number]) => [ox + (lon - lon0) * k, oy + (lat1 - lat) * k] as const;
}

export function RouteMap({ countries, homeLabel = 'Dhaka' }: { countries: Country[]; homeLabel?: string }) {
    const known = countries.filter((c) => COORDS[c.iso2]);
    const project = makeProjection([DHAKA, ...known.map((c) => COORDS[c.iso2])]);
    const [dx, dy] = project(DHAKA);
    const points = known.map((c) => ({ c, xy: project(COORDS[c.iso2]) }));

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={countries.map((c) => c.name).join(', ')}>
            <defs>
                <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" /></pattern>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#E9C46A" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#E9C46A" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="route" x1="0" x2="1">
                    <stop offset="0%" stopColor="#E9C46A" />
                    <stop offset="100%" stopColor="#22a052" />
                </linearGradient>
            </defs>
            <rect width={W} height={H} fill="url(#dots)" className="text-white/[0.07]" />
            {points.map(({ c, xy: [x, y] }) => {
                const mx = (dx + x) / 2, my = Math.min(dy, y) - 40 - Math.abs(dx - x) * 0.25;
                return (
                    <g key={c.iso2}>
                        <path d={`M${dx},${dy} Q${mx},${my} ${x},${y}`} fill="none" stroke="url(#route)" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 7">
                            <animate attributeName="stroke-dashoffset" from="120" to="0" dur="6s" repeatCount="indefinite" />
                        </path>
                        <circle cx={x} cy={y} r="18" fill="url(#glow)" />
                        <circle cx={x} cy={y} r="5" fill="#fff" stroke="#22a052" strokeWidth="3" />
                        <foreignObject x={x - 80} y={y + 10} width="160" height="40">
                            <div className="flex justify-center">
                                <span className="whitespace-nowrap rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold text-navy-900 shadow">{c.flag} {c.name}</span>
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
            <circle cx={dx} cy={dy} r="34" fill="url(#glow)" />
            <circle cx={dx} cy={dy} r="7" fill="#E9C46A" stroke="#fff" strokeWidth="3" />
            <text x={dx} y={dy - 18} textAnchor="middle" className="fill-white text-[14px] font-semibold">{homeLabel} 🇧🇩</text>
        </svg>
    );
}
