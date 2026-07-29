import { NextResponse } from "next/server";
import { proiecte } from "@/lib/data/proiecte";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const localitate = searchParams.get("localitate");

  let data = [...proiecte];

  if (status && status !== "all") {
    data = data.filter((p) => p.status === status);
  }
  if (localitate && localitate !== "all") {
    data = data.filter((p) =>
      p.localitate.toLowerCase().includes(localitate.toLowerCase())
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
