import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const days = Number(process.env.PAGEVIEW_RETENTION_DAYS || "90");
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (Number.isFinite(days) ? days : 90));

  try {
    const result = await prisma.pageView.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return NextResponse.json({
      ok: true,
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      deleted: result.count,
    });
  } catch (e) {
    console.error("[cron/purge-pageviews]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Eroare" },
      { status: 500 }
    );
  }
}
