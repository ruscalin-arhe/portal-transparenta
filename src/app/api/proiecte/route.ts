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
    }));

    return NextResponse.json(mapped, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error(e);
cat > src/hooks/use-proiecte.ts << 'ENDFILE'
"use client";

import { useQuery } from "@tanstack/react-query";

export type ProiectDTO = {
  id: string;
  nume: string;
  status: string;
  localitate: string;
  valoare: string;
  progres: number;
  descriere: string;
  dataStart?: string | null;
  dataEstimata?: string | null;
  beneficiar?: string | null;
  categorie?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export function useProiecte(status = "all", localitate = "all") {
  return useQuery({
    queryKey: ["proiecte", status, localitate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (localitate && localitate !== "all") params.set("localitate", localitate);
      const q = params.toString();
      const res = await fetch(`/api/proiecte${q ? `?${q}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Eroare incarcare proiecte");
      return res.json() as Promise<ProiectDTO[]>;
    },
  });
}
