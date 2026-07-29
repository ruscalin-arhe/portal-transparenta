import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LEGACY: Record<string, string> = {
  "1": "retea-electrica-nord",
  "2": "infrastructura-digitala-est",
  "3": "reabilitare-dj152",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raw } = await context.params;
    const id = LEGACY[raw] ?? raw;

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
      bugetAlocatMil: p.bugetAlocatMil,
      bugetCheltuitMil: p.bugetCheltuitMil,
      depasireBugetMil: p.depasireBugetMil,
      zileIntarziere: p.zileIntarziere,
      progresFizic: p.progresFizic,
      progresFinanciar: p.progresFinanciar,
      risc: p.risc,
      sursaFinantare: p.sursaFinantare,
      contractor: p.contractor,
      ultimaActualizare: p.ultimaActualizare,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
