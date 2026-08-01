import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { searchPnrrPackages, pickCsvResources } from "@/lib/opendata/ckan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const q = new URL(request.url).searchParams.get("q") || "PNRR";
    const { count, results } = await searchPnrrPackages(q, 15);

    const packages = results.map((p) => ({
      id: p.id,
      name: p.name,
      title: p.title,
      notes: (p.notes || "").slice(0, 280),
      resources: pickCsvResources(p).map((r) => ({
        id: r.id,
        name: r.name,
        format: r.format,
        url: r.url,
        last_modified: r.last_modified,
      })),
    }));

    return NextResponse.json({
      meta: {
        source: "https://data.gov.ro/api/3/action/package_search",
        q,
        count,
      },
      packages,
    });
  } catch (e) {
    console.error("pnrr discover", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare" },
      { status: 500 }
    );
  }
}
