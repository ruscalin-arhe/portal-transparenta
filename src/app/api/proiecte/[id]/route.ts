import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const p = await prisma.proiect.findFirst({
      where: {
        published: true,
        OR: [{ slug: id }, { id }],
      },
    });

    if (!p) {
      return NextResponse.json({ error: "Negasit" }, { status: 404 });
    }

    return NextResponse.json({
      id: p.slug,
      nume: p.nume,
      status: p.status,
      localitate: p.localitate,
      valoare: p.valoareText,
      progres: p.progres,
      descriere: p.descriere,
      dataStart: p.dataStart,
      dataEstimata: p.dataEstimata,
      beneficiar: p.beneficiar,
      categorie: p.categorie,
      lat: p.lat,
      lng: p.lng,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
