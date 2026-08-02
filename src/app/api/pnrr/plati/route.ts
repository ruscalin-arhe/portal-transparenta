import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const judet = searchParams.get("judet");

    const where: Record<string, unknown> = { published: true };
    if (judet) {
      where.judet = { contains: judet, mode: "insensitive" as const };
    }

    const total = await prisma.pnrrPlata.count({ where });
    const sumaAgg = await prisma.pnrrPlata.aggregate({
      where,
      _sum: { suma: true },
    });

    const byJudet = await prisma.pnrrPlata.groupBy({
      by: ["judet"],
      where,
      _sum: { suma: true },
      _count: true,
      orderBy: { _sum: { suma: "desc" } },
      take: 42,
    });

    const recent = await prisma.pnrrPlata.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        componenta: true,
        investitie: true,
        beneficiar: true,
        suma: true,
        moneda: true,
        dataPlata: true,
        judet: true,
        sourceUrl: true,
        retrievedAt: true,
      },
    });

    return NextResponse.json({
      meta: {
        total,
        sumaTotala: sumaAgg._sum.suma ?? 0,
        note: "Date importate din surse publice. Verifica sourceUrl.",
      },
      byJudet,
      recent,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("pnrr/plati", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
