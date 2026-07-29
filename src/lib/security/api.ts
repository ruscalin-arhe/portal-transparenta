import { NextResponse } from "next/server";

export function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: message, ...extra },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

/** Verifică header Authorization: Bearer <ADMIN_API_SECRET> */
export function requireAdminSecret(request: Request): boolean {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return auth.slice(7) === secret;
}
