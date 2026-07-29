"use client";

import { useQuery } from "@tanstack/react-query";
import type { Proiect } from "@/lib/data/proiecte";

type Filters = {
  status?: string;
  localitate?: string;
};

async function fetchProiecte(filters: Filters = {}): Promise<Proiect[]> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.localitate && filters.localitate !== "all") {
    params.set("localitate", filters.localitate);
  }

  const qs = params.toString();
  const res = await fetch(`/api/proiecte${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Eroare la incarcarea proiectelor");
  return res.json();
}

export function useProiecte(filters: Filters = {}) {
  return useQuery({
    queryKey: ["proiecte", filters],
    queryFn: () => fetchProiecte(filters),
  });
}

async function fetchProiect(id: string): Promise<Proiect> {
  const res = await fetch(`/api/proiecte/${id}`);
  if (!res.ok) throw new Error("Proiect negasit");
  return res.json();
}

export function useProiect(id: string) {
  return useQuery({
    queryKey: ["proiect", id],
    queryFn: () => fetchProiect(id),
    enabled: !!id,
  });
}
