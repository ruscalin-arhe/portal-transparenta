import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  nume: z.string().min(2),
  email: z.string().email(),
  telefon: z.string().optional(),
  subiect: z.string().min(3),
  mesaj: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Date invalide", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const sesizare = await prisma.sesizare.create({
      data: {
        nume: parsed.data.nume,
        email: parsed.data.email,
        telefon: parsed.data.telefon || null,
        subiect: parsed.data.subiect,
        mesaj: parsed.data.mesaj,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sesizarea a fost inregistrata. Va multumim!",
      id: sesizare.id,
    });
  } catch (error) {
    console.error("Eroare sesizare:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const lista = await prisma.sesizare.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(lista);
  } catch (error) {
    console.error("Eroare listare:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
