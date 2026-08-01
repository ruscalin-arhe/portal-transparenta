const CKAN_BASE =
  process.env.CKAN_BASE_URL || "https://data.gov.ro/api/3/action";

export type CkanResource = {
  id: string;
  name?: string;
  format?: string;
  url?: string;
  last_modified?: string;
};

export type CkanPackage = {
  id: string;
  name: string;
  title?: string;
  notes?: string;
  resources?: CkanResource[];
};

async function ckanGet<T>(action: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const url = `${CKAN_BASE}/${action}?${qs}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`CKAN ${action} HTTP ${res.status}`);
  }
  const body = (await res.json()) as {
    success: boolean;
    result: T;
    error?: { message?: string };
  };
  if (!body.success) {
    throw new Error(body.error?.message || `CKAN ${action} failed`);
  }
  return body.result;
}

/** Cauta pachete PNRR in catalog */
export async function searchPnrrPackages(q = "PNRR", rows = 20) {
  const result = await ckanGet<{
    count: number;
    results: CkanPackage[];
  }>("package_search", { q, rows: String(rows) });
  return result;
}

/** Detaliu pachet dupa name/id */
export async function getPackage(idOrName: string) {
  return ckanGet<CkanPackage>("package_show", { id: idOrName });
}

export function pickCsvResources(pkg: CkanPackage): CkanResource[] {
  return (pkg.resources || []).filter((r) => {
    const f = (r.format || "").toUpperCase();
    const url = (r.url || "").toLowerCase();
    return (
      f.includes("CSV") ||
      f.includes("XLS") ||
      url.endsWith(".csv") ||
      url.endsWith(".xlsx")
    );
  });
}
