import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proiect = searchParams.get("proiect");

    const lista = await prisma.document.findMany({
      where: {
        published: true,
        ...(proiect ? { proiect: { slug: proiect } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        proiect: { select: { slug: true, nume: true } },
      },
    });

    return NextResponse.json(
      lista.map((d) => ({
        id: d.id,
        titlu: d.titlu,
        tip: d.tip,
        data: d.data,
        dimensiune: d.dimensiune,
        url: d.url,
        proiectSlug: d.proiect?.slug ?? null,
        proiectNume: d.proiect?.nume ?? null,
      }))
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Eroare server", detail: message },
      { status: 500 }
    );
  }
}
