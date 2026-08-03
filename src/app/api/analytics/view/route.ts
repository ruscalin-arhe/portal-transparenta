import { after, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db/retry";
import { shouldSkipTracking } from "@/lib/analytics/bots";
import { clientIp, extractGeo } from "@/lib/analytics/geo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path =
      typeof body.path === "string" && body.path.trim()
        ? body.path.trim().slice(0, 500)
        : "/";

    const userAgent = request.headers.get("user-agent");

    if (shouldSkipTracking({ userAgent, path })) {
      return NextResponse.json({ ok: true, skipped: "bot_or_noise" });
    }

    const session = await auth();
    const isAdmin = Boolean(session?.user);
    const userId =
      typeof session?.user?.email === "string" ? session.user.email : null;

    const geo = extractGeo(request.headers);
    const ip = clientIp(request.headers);
    const referer = request.headers.get("referer")?.slice(0, 500) ?? null;
    const ua = userAgent?.slice(0, 500) ?? null;

    // Raspunde rapid; scrierea ruleaza dupa (Next after / Vercel waitUntil)
    after(async () => {
      try {
        await withRetry(
          () =>
            prisma.pageView.create({
              data: {
                path,
                method: "GET",
                ip,
                country: geo.country,
                city: geo.city,
                referer,
                userAgent: ua,
                isAdmin,
                userId,
              },
            }),
          {
            retries: 3,
            baseDelayMs: 200,
            maxDelayMs: 2000,
            label: "pageView.create",
          }
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const code = (e as { code?: string })?.code;
        console.error("[analytics/view] DB write failed", {
          code,
          msg: msg.slice(0, 300),
          path,
          geo: geo.source,
        });
      }
    });

    return NextResponse.json({ ok: true, geo: geo.source }, { status: 202 });
  } catch (e) {
    console.error("POST /api/analytics/view", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
