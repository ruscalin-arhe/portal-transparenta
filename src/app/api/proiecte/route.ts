import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const localitate = searchParams.get("localitate");

    const where: {
      published: boolean;
      status?: string;
      localitate?: { contains: string; mode: "insensitive" };
    } = { published: true };

    if (status && status !== "all") {
      where.status = status;
    }
    if (localitate && localitate !== "all") {
      where.localitate = { contains: localitate, mode: "insensitive" };
    }

    const data = await prisma.proiect.findMany({
      where,
      orderBy: { nume: "asc" },
    });

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
    }));

    return NextResponse.json(mapped, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
