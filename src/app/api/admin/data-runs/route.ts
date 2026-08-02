import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    const dataSourceId = new URL(request.url).searchParams.get("dataSourceId");

    const lista = await prisma.dataRun.findMany({
      where: dataSourceId ? { dataSourceId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        dataSource: {
          select: {
            id: true,
            slug: true,
            name: true,
            type: true,
            organization: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
        _count: { select: { pnrrPlati: true } },
      },
    });

    return NextResponse.json(lista);
  } catch (e) {
    console.error("GET /api/admin/data-runs", e);
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
    const dataSourceId =
      typeof body.dataSourceId === "string" ? body.dataSourceId.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";

    if (!dataSourceId || !status) {
      return NextResponse.json(
        { error: "dataSourceId și status sunt obligatorii" },
        { status: 400 }
      );
    }

    const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();

    const created = await prisma.dataRun.create({
      data: {
        dataSourceId,
        status,
        startedAt,
        finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
        recordsTotal: body.recordsTotal ?? null,
        recordsOk: body.recordsOk ?? null,
        recordsError: body.recordsError ?? null,
        sourceFile: body.sourceFile ?? null,
        sourceUrl: body.sourceUrl ?? null,
        errorLog: body.errorLog ?? null,
        metadata: body.metadata ?? undefined,
      },
      include: {
        dataSource: {
          select: { id: true, slug: true, name: true },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        return NextResponse.json(
          { error: "dataSourceId invalid" },
          { status: 400 }
        );
      }
    }
    console.error("POST /api/admin/data-runs", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare server" },
      { status: 500 }
    );
  }
}
