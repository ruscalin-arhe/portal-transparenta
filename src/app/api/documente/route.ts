import { NextResponse } from "next/server";
import { documente } from "@/lib/data/documente";

export async function GET() {
  return NextResponse.json(documente, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
