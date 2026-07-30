import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const localitate = searchParams.get("localitate");

    const all = await prisma.proiect.findMany({
      where: { published: true },
      orderBy: { nume: "asc" },
    });

    let data = all;
    if (status && status !== "all") {
      const n = norm(status);
      data = data.filter((p) => norm(p.status) === n);
    }
    if (localitate && localitate !== "all") {
      const n = norm(localitate);
      data = data.filter((p) => norm(p.localitate).includes(n));
    }

    const mapped = data.map((p) => ({
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
    }));

    return NextResponse.json(mapped, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
