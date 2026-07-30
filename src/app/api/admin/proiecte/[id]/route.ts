import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.string().min(1).max(80).optional(),
  progres: z.number().int().min(0).max(100).optional(),
  zileIntarziere: z.number().int().min(0).max(5000).optional(),
  bugetAlocatMil: z.number().min(0).optional().nullable(),
  bugetCheltuitMil: z.number().min(0).optional().nullable(),
  depasireBugetMil: z.number().min(0).optional().nullable(),
  progresFizic: z.number().int().min(0).max(100).optional().nullable(),
  progresFinanciar: z.number().int().min(0).max(100).optional().nullable(),
  risc: z.string().max(40).optional().nullable(),
  contractor: z.string().max(200).optional().nullable(),
  sursaFinantare: z.string().max(200).optional().nullable(),
  ultimaActualizare: z.string().max(40).optional().nullable(),
  published: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Date invalide", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.proiect.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) {
      return NextResponse.json({ error: "Negasit" }, { status: 404 });
    }

    const updated = await prisma.proiect.update({
      where: { id: existing.id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
