import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const data: Record<string, unknown> = {};
    for (const k of [
      "name",
      "description",
      "type",
      "sourceUrl",
      "frequency",
    ] as const) {
      if (k in body) data[k] = body[k];
    }
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.published === "boolean") data.published = body.published;
    if (typeof body.slug === "string" && body.slug.trim()) {
      data.slug = body.slug.trim();
    }
    // channel intentional: no UI / no PATCH from client in this iteration
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nimic de actualizat" },
        { status: 400 }
      );
    }
    const updated = await prisma.dataSource.update({
      where: { id },
      data,
      include: {
        organization: { select: { id: true, slug: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Negasit" }, { status: 404 });
      }
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Slug-ul exista deja" },
          { status: 409 }
        );
      }
    }
    console.error("PATCH data-sources/[id]", e);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
