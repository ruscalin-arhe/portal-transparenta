import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const lista = await prisma.dataSource.findMany({
      orderBy: { name: "asc" },
      include: {
        organization: {
          select: { id: true, slug: true, name: true, shortName: true },
        },
        _count: { select: { runs: true } },
      },
    });

    return NextResponse.json(lista);
  } catch (e) {
    console.error("GET /api/admin/data-sources", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare server" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const organizationId =
      typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";

    if (!slug || !name || !organizationId || !type) {
      return NextResponse.json(
        { error: "slug, name, organizationId și type sunt obligatorii" },
        { status: 400 }
      );
    }

    const channel =
      body.channel === "PRIVATE" || body.channel === "PUBLIC"
        ? body.channel
        : "PUBLIC";

    const created = await prisma.dataSource.create({
      data: {
        slug,
        name,
        description: body.description ?? null,
        organizationId,
        type,
        sourceUrl: body.sourceUrl ?? null,
        channel,
        frequency: body.frequency ?? null,
        active: body.active ?? true,
        published: body.published ?? true,
      },
      include: {
        organization: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Slug-ul există deja" },
          { status: 409 }
        );
      }
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "organizationId invalid" },
          { status: 400 }
        );
      }
    }
    console.error("POST /api/admin/data-sources", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare server" },
      { status: 500 }
    );
  }
}
