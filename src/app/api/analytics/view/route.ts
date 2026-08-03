import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path =
      typeof body.path === "string" && body.path.trim()
        ? body.path.trim().slice(0, 500)
        : "/";

    const session = await auth();
    const isAdmin = Boolean(session?.user);
    const userId = session?.user?.email ?? null;

    // Vercel geo (daca exista)
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;
    const city = request.headers.get("x-vercel-ip-city") || null;

    await prisma.pageView.create({
      data: {
        path,
        method: "GET",
        ip: clientIp(request),
        country,
        city,
        referer: request.headers.get("referer")?.slice(0, 500) ?? null,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
        isAdmin,
        userId,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("POST /api/analytics/view", e);
    // nu bloca UI-ul public
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
