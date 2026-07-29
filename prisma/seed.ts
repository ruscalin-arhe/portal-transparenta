import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const proiecte = [
  {
    slug: "retea-electrica-nord",
    nume: "Modernizare rețea electrică – Sector Nord",
    status: "În derulare",
    localitate: "Cluj-Napoca",
    valoareText: "12.4 mil. RON",
    valoareMil: 12.4,
    progres: 67,
    descriere:
      "Modernizare rețea medie tensiune: cabluri și posturi de transformare.",
    dataStart: "15.03.2025",
    dataEstimata: "30.11
cat > src/app/api/proiecte/route.ts << 'ENDFILE'
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function mapProiect(p: {
  slug: string;
  nume: string;
  status: string;
  localitate: string;
  valoareText: string;
  progres: number;
  descriere: string;
  dataStart: string | null;
  dataEstimata: string | null;
  beneficiar: string | null;
  categorie: string | null;
  lat: number | null;
  lng: number | null;
  bugetAlocatMil: number | null;
  bugetCheltuitMil: number | null;
  depasireBugetMil: number | null;
  zileIntarziere: number;
  progresFizic: number | null;
  progresFinanciar: number | null;
  risc: string | null;
  sursaFinantare: string | null;
  contractor: string | null;
  ultimaActualizare: string | null;
}) {
  return {
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
  };
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

    return NextResponse.json(data.map(mapProiect), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
