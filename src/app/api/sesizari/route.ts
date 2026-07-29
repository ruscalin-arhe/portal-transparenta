import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  getClientIp,
  jsonError,
  jsonOk,
  requireAdminSecret,
} from "@/lib/security/api";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  nume: z.string().min(2).max(120).trim(),
  email: z.string().email().max(200).trim(),
  telefon: z.string().max(30).trim().optional().or(z.literal("")),
  subiect: z.string().min(3).max(200).trim(),
  mesaj: z.string().min(10).max(2000).trim(),
});

/** POST public – cu rate limit */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`sesizari:post:${ip}`, 5, 60_000);
    if (!limited.ok) {
      return jsonError("Prea multe cereri. Încearcă din nou în 1 minut.", 429);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return jsonError("Content-Type invalid", 415);
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Date invalide", 400, {
        details: parsed.error.flatten(),
      });
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

    // Nu expunem date personale în răspuns
    return jsonOk(
      {
        success: true,
        message: "Sesizarea a fost înregistrată. Vă mulțumim!",
        id: sesizare.id,
      },
      201
    );
  } catch (error) {
    console.error("Eroare sesizare:", error);
    return jsonError("Eroare server", 500);
  }
}

/** GET – doar cu ADMIN_API_SECRET (până introducem auth) */
export async function GET(request: Request) {
  try {
    if (!requireAdminSecret(request)) {
      return jsonError("Neautorizat", 401);
    }

    const lista = await prisma.sesizare.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        nume: true,
        email: true,
        telefon: true,
        subiect: true,
        mesaj: true,
        status: true,
        createdAt: true,
      },
    });

    return jsonOk(lista);
  } catch (error) {
    console.error("Eroare listare:", error);
    return jsonError("Eroare server", 500);
  }
}
