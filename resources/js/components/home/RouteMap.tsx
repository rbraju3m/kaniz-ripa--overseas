import type { Country } from '@/lib/types';

/** Approximate capital coordinates [lon, lat], so any country added in the CMS appears on the map. */
const COORDS: Record<string, [number, number]> = {
    // Middle East
    SA: [46.7, 24.7], AE: [54.4, 24.5], QA: [51.5, 25.3], KW: [48.0, 29.4], OM: [58.4, 23.6], BH: [50.6, 26.2], JO: [35.9, 31.9],
    LB: [35.5, 33.9], IQ: [44.4, 33.3], IR: [51.4, 35.7], IL: [35.2, 31.8], PS: [35.2, 31.9], SY: [36.3, 33.5], YE: [44.2, 15.4],
    TR: [32.9, 39.9], CY: [33.4, 35.2],
    // Asia
    MY: [101.7, 3.1], VN: [105.8, 21.0], SG: [103.8, 1.35], JP: [139.7, 35.7], KR: [127.0, 37.6], CN: [116.4, 39.9], TH: [100.5, 13.8],
    MV: [73.5, 4.2], BN: [114.9, 4.9], ID: [106.8, -6.2], PH: [121.0, 14.6], KH: [104.9, 11.6], LA: [102.6, 17.97], MM: [96.1, 19.75],
    NP: [85.3, 27.7], BT: [89.6, 27.5], LK: [79.9, 6.9], IN: [77.2, 28.6], PK: [73.0, 33.7], AF: [69.2, 34.5], HK: [114.2, 22.3],
    TW: [121.5, 25.0], MO: [113.5, 22.2], MN: [106.9, 47.9], KZ: [71.4, 51.2], UZ: [69.2, 41.3], TM: [58.4, 37.9], KG: [74.6, 42.9],
    TJ: [68.8, 38.6], AZ: [49.9, 40.4], GE: [44.8, 41.7], AM: [44.5, 40.2], TL: [125.6, -8.55],
    // Europe
    RO: [26.1, 44.4], PL: [21.0, 52.2], HR: [16.0, 45.8], RS: [20.5, 44.8], HU: [19.0, 47.5], GR: [23.7, 38.0], IT: [12.5, 41.9],
    GB: [-0.1, 51.5], AT: [16.4, 48.2], DE: [13.4, 52.5], FR: [2.35, 48.9], ES: [-3.7, 40.4], PT: [-9.1, 38.7], NL: [4.9, 52.4],
    BE: [4.35, 50.85], CH: [7.45, 46.95], SE: [18.1, 59.3], NO: [10.75, 59.9], DK: [12.6, 55.7], FI: [24.9, 60.2], IE: [-6.3, 53.35],
    CZ: [14.4, 50.1], SK: [17.1, 48.15], SI: [14.5, 46.05], BG: [23.3, 42.7], LT: [25.3, 54.7], LV: [24.1, 56.95], EE: [24.75, 59.45],
    MT: [14.5, 35.9], LU: [6.1, 49.6], AL: [19.8, 41.3], BA: [18.4, 43.85], ME: [19.26, 42.44], MK: [21.43, 42.0], MD: [28.86, 47.0],
    UA: [30.5, 50.45], BY: [27.56, 53.9], RU: [37.6, 55.75], IS: [-21.9, 64.1],
    // Africa
    LY: [13.2, 32.9], EG: [31.2, 30.0], MU: [57.5, -20.2], SC: [55.45, -4.6], ZA: [28.2, -25.75], NG: [7.5, 9.05], KE: [36.8, -1.3],
    MA: [-6.8, 34.0], DZ: [3.05, 36.75], TN: [10.2, 36.8], SD: [32.5, 15.6], ET: [38.75, 9.0], GH: [-0.2, 5.6], TZ: [35.75, -6.2],
    UG: [32.6, 0.3], DJ: [43.15, 11.6],
    // Americas
    US: [-77.0, 38.9], CA: [-75.7, 45.4], MX: [-99.1, 19.4], BR: [-47.9, -15.8], AR: [-58.4, -34.6], CL: [-70.65, -33.45],
    CO: [-74.1, 4.7], PE: [-77.0, -12.05],
    // Oceania
    AU: [149.1, -35.3], NZ: [174.8, -41.3], FJ: [178.4, -18.1], PG: [147.2, -9.4],
};
export const isMappable = (iso2: string) => !!COORDS[iso2?.toUpperCase()];

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
