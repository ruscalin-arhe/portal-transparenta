import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proiect = searchParams.get("proiect");

    const where: {
      published: boolean;
      proiect?: { slug: string };
    } = { published: true };

    if (proiect) {
      where.proiect = { slug: proiect };
    }

    const lista = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        proiect: { select: { slug: true, nume: true } },
      },
    });

    const mapped = lista.map((d) => ({
      id: d.id,
      titlu: d.titlu,
      tip: d.tip,
      data: d.data,
      dimensiune: d.dimensiune,
      url: d.url,
      proiectSlug: d.proiect?.slug ?? null,
      proiectNume: d.proiect?.nume ?? null,
    }));

    return NextResponse.json(mapped, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
