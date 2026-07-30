"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RiscLegend } from "@/components/harta/risc-legend";
import type { ProiectMap } from "@/components/harta/leaflet-map";
import {
  normalizeRisc,
  type NivelRisc,
} from "@/lib/risc-colors";

const LeafletMap = dynamic(() => import("@/components/harta/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,560px)] rounded-lg border flex items-center justify-center text-muted-foreground text-sm">
      Se incarca harta...
    </div>
  ),
});

function HartaInner() {
  const search = useSearchParams();
  const focus = search.get("proiect");
  const [proiecte, setProiecte] = useState([] as ProiectMap[]);
  const [err, setErr] = useState(null as string | null);
  const [filter, setFilter] = useState("all" as NivelRisc | "all");

  useEffect(() => {
    fetch("/api/proiecte", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Nu s-au putut incarca proiectele");
        return r.json();
      })
      .then(setProiecte)
      .catch((e) => setErr(e.message));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return proiecte;
    return proiecte.filter((p) => normalizeRisc(p.risc) === filter);
  }, [proiecte, filter]);

  const counts = useMemo(() => {
    const c: Partial<Record<NivelRisc | "all", number>> = {
      all: proiecte.length,
      scazut: 0,
      mediu: 0,
      ridicat: 0,
      nespecificat: 0,
    };
    for (const p of proiecte) {
      const k = normalizeRisc(p.risc);
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [proiecte]);

  if (err) return <p className="text-destructive">{err}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Harta</h1>
        <p className="text-muted-foreground mt-2">
          Localizare geospatiala. Culorile urmeaza scara administrativa (semafor).
          Click pe legendă pentru filtrare.
          {focus ? (
            <span className="block text-sm mt-1">
              Focus: <code className="text-foreground">{focus}</code>
            </span>
          ) : null}
        </p>
      </div>
      <LeafletMap proiecte={filtered} focusId={focus} />
      <RiscLegend
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />
    </div>
  );
}

export default function HartaPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Se incarca...</p>}>
      <HartaInner />
    </Suspense>
  );
}
