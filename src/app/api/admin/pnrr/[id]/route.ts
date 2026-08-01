import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { validatePnrrPlata } from "@/lib/data-quality/pnrr-validate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const draft = {
      componenta: body.componenta ?? null,
      investitie: body.investitie ?? null,
      beneficiar: body.beneficiar ?? null,
      suma: body.suma ?? null,
      dataPlata: body.dataPlata ?? null,
      judet: body.judet ?? null,
      sourceUrl: body.sourceUrl,
    };

    const v = validatePnrrPlata(draft);
    const dataStatus =
      body.forceStatus === "VALIDATED" ? "VALIDATED" : v.dataStatus;

    const updated = await prisma.pnrrPlata.update({
      where: { id },
      data: {
        componenta: draft.componenta,
        investitie: draft.investitie,
        beneficiar: draft.beneficiar,
        suma: draft.suma,
        dataPlata: draft.dataPlata,
        judet: draft.judet,
        ...(draft.sourceUrl ? { sourceUrl: draft.sourceUrl } : {}),
        dataStatus,
        completenessScore: v.completenessScore,
        validationReport: v.reportJson,
        published: dataStatus === "COMPLETE" || dataStatus === "VALIDATED",
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("PATCH /api/admin/pnrr/[id]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
