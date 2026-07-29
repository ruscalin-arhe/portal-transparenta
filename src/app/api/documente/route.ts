import { NextResponse } from "next/server";
import { documente } from "@/lib/data/documente";

export async function GET() {
  return NextResponse.json(documente);
}
