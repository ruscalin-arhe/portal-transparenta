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

    const lista = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { dataSources: true } },
      },
    });

    return NextResponse.json(lista);
  } catch (e) {
    console.error("GET /api/admin/organizations", e);
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

    if (!slug || !name) {
      return NextResponse.json(
        { error: "slug și name sunt obligatorii" },
        { status: 400 }
      );
    }

    const created = await prisma.organization.create({
      data: {
        slug,
        name,
        shortName: body.shortName ?? null,
        type: body.type ?? null,
        website: body.website ?? null,
        description: body.description ?? null,
        published: body.published ?? true,
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
    }
    console.error("POST /api/admin/organizations", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare server" },
      { status: 500 }
    );
  }
}
