import { NextResponse } from "next/server";
import { getProiectById } from "@/lib/data/proiecte";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proiect = getProiectById(id);

  if (!proiect) {
    return NextResponse.json({ error: "Negasit" }, { status: 404 });
  }

  return NextResponse.json(proiect);
}
