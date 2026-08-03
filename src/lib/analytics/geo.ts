/** Extrage geo din header-ele CDN (Vercel / Cloudflare). */

export type GeoInfo = {
  country: string | null;
  city: string | null;
  region: string | null;
  /** sursa folosita, pentru debug */
  source: "vercel" | "cloudflare" | "none";
};

function clean(s: string | null | undefined, max = 100): string | null {
  if (!s) return null;
  let v = s.trim();
  if (!v || v === "XX" || v === "T1" || v === "unknown") return null;
  try {
    v = decodeURIComponent(v);
  } catch {
    /* keep raw */
  }
  return v.slice(0, max) || null;
}

/** ISO country uppercase (RO, DE, …) */
function normalizeCountry(c: string | null): string | null {
  if (!c) return null;
  const up = c.trim().toUpperCase();
  if (up.length === 2 && /^[A-Z]{2}$/.test(up)) return up;
  return clean(c, 8);
}

/**
 * Prioritate:
 * 1. Vercel (x-vercel-ip-*)
 * 2. Cloudflare (cf-ipcountry)
 */
export function extractGeo(headers: Headers): GeoInfo {
  const vercelCountry = headers.get("x-vercel-ip-country");
  const vercelCity = headers.get("x-vercel-ip-city");
  const vercelRegion = headers.get("x-vercel-ip-country-region");

  if (vercelCountry || vercelCity || vercelRegion) {
    return {
      country: normalizeCountry(vercelCountry),
      city: clean(vercelCity, 120),
      region: clean(vercelRegion, 40),
      source: "vercel",
    };
  }

  const cfCountry = headers.get("cf-ipcountry");
  if (cfCountry) {
    return {
      country: normalizeCountry(cfCountry),
      city: null,
      region: null,
      source: "cloudflare",
    };
  }

  return { country: null, city: null, region: null, source: "none" };
}

export function clientIp(headers: Headers): string | null {
  const xf = headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  // Vercel
  const v = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return v ? v.slice(0, 64) : null;
}
