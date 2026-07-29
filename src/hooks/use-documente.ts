"use client";

import { useQuery } from "@tanstack/react-query";
import type { DocumentPublic } from "@/lib/data/documente";

async function fetchDocumente(): Promise<DocumentPublic[]> {
  const res = await fetch("/api/documente");
  if (!res.ok) throw new Error("Eroare la incarcarea documentelor");
  return res.json();
}

export function useDocumente() {
  return useQuery({
    queryKey: ["documente"],
    queryFn: fetchDocumente,
  });
}
