"use client";

import { useQuery } from "@tanstack/react-query";

export type ProiectDTO = {
  id: string;
  nume: string;
  status: string;
  localitate: string;
  valoare: string;
  progres: number;
  descriere: string;
  dataStart?: string | null;
  dataEstimata?: string | null;
  beneficiar?: string | null;
  categorie?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export function useProiecte(status = "all", localitate = "all") {
  return useQuery({
    queryKey: ["proiecte", status, localitate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (localitate && localitate !== "all") params.set("localitate", localitate);
      const q = params.toString();
      const res = await fetch(`/api/proiecte${q ? `?${q}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Eroare incarcare proiecte");
      return res.json() as Promise<ProiectDTO[]>;
    },
  });
}
