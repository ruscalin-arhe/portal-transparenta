import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvEscape(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const scope = new URL(request.url).searchParams.get("scope") || "all";
  const where =
    scope === "admin"
      ? { isAdmin: true }
      : scope === "public"
        ? { isAdmin: false }
        : {};

  const rows = await prisma.pageView.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "createdAt",
    "path",
    "ip",
    "country",
    "city",
    "referer",
    "isAdmin",
    "userId",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.createdAt.toISOString(),
        r.path,
        r.ip,
        r.country,
        r.city,
        r.referer,
        r.isAdmin,
        r.userId,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const body = lines.join("\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trafic-${scope}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
