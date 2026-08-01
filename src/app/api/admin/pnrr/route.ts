import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const status = new URL(request.url).searchParams.get("status");

    const lista = await prisma.pnrrPlata.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const withStatus = lista.map((r) => ({
      ...r,
      dataStatus: r.dataStatus || "UNKNOWN",
    }));

    const filtered =
      !status || status === "all"
        ? withStatus
        : withStatus.filter((r) => r.dataStatus === status);

    const countsMap: Record<string, number> = {};
    for (const r of withStatus) {
      countsMap[r.dataStatus] = (countsMap[r.dataStatus] || 0) + 1;
    }
    const counts = Object.entries(countsMap).map(([dataStatus, _count]) => ({
      dataStatus,
      _count,
    }));

    return NextResponse.json({
      lista: filtered,
      counts,
      total: withStatus.length,
    });
  } catch (e) {
    console.error("GET /api/admin/pnrr", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare server" },
      { status: 500 }
    );
  }
}
