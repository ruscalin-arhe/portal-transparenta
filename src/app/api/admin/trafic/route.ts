import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "all"; // all | public | admin

  const where =
    scope === "admin"
      ? { isAdmin: true }
      : scope === "public"
        ? { isAdmin: false }
        : {};

  const [total, recent, byPath, byCountry] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where,
      _count: true,
      orderBy: { _count: { path: "desc" } },
      take: 20,
    }),
    prisma.pageView.groupBy({
      by: ["country"],
      where,
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 20,
    }),
  ]);

  return NextResponse.json({ total, recent, byPath, byCountry });
}
