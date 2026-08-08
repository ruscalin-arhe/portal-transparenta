import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Browser navigation → UI page (evită JSON pretty-print)
    const accept = request.headers.get("accept") || "";
    if (accept.includes("text/html") && !accept.includes("application/json")) {
      return NextResponse.redirect(new URL("/achizitii", request.url));
    }

    const { searchParams } = new URL(request.url);
    const cpv = searchParams.get("cpv");
    const q = searchParams.get("q");
    const take = Math.min(Number(searchParams.get("take") || 50), 200);
    const skip = Number(searchParams.get("skip") || 0);

    const where: Record<string, unknown> = { published: true };
    if (cpv) {
      where.OR = [
        { cpvMain: { contains: cpv, mode: "insensitive" } },
        { cpvCodes: { has: cpv } },
      ];
    }
    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { contractingAuthority: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [lista, total] = await Promise.all([
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
          cpvCodes: true,
          valueEstimated: true,
          valueCurrency: true,
          contractingAuthority: true,
          status: true,
          publicationDate: true,
          deadline: true,
          procedureType: true,
          sourceUrl: true,
        },
      }),
      prisma.tender.count({ where }),
    ]);

    return NextResponse.json({ total, take, skip, data: lista });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Eroare server", detail: message },
      { status: 500 }
    );
  }
}
