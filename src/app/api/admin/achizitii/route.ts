import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const take = Math.min(Number(searchParams.get("take") || 50), 200);
    const skip = Number(searchParams.get("skip") || 0);

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { contractingAuthority: { contains: q, mode: "insensitive" } },
        { externalId: { contains: q, mode: "insensitive" } },
        { cpvMain: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.tender.findMany({
        where,
        orderBy: { publicationDate: "desc" },
        take,
        skip,
        select: {
          id: true,
          externalId: true,
          title: true,
          cpvMain: true,
          valueEstimated: true,
          valueCurrency: true,
          contractingAuthority: true,
          status: true,
          publicationDate: true,
          procedureType: true,
          published: true,
        },
      }),
      prisma.tender.count({ where }),
    ]);

    return NextResponse.json({ total, take, skip, data });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Eroare server", detail: message },
      { status: 500 }
    );
  }
}
