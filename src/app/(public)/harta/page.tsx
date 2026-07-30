"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { RiscLegend } from "@/components/harta/risc-legend";
import {
  MapFilters,
  defaultMapFilters,
  type MapFilterState,
} from "@/components/harta/map-filters";
import type { ProiectMap } from "@/components/harta/leaflet-map";
import { normalizeRisc, type NivelRisc } from "@/lib/risc-colors";

const LeafletMap = dynamic(() => import("@/components/harta/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[min(70vh,560px)] rounded-lg border flex items-center justify-center text-muted-foreground text-sm">
      Se incarca harta...
    </div>
  ),
});

function applyFilters(list: ProiectMap[], f: MapFilterState) {
  return list.filter((p) => {
    const nivel = normalizeRisc(p.risc);
    if (f.riscuri.length && !f.riscuri.includes(nivel)) return false;
    if (f.status !== "all" && p.status !== f.status) return false;
    if (f.onlyDelayed && !(p.zileIntarziere && p.zileIntarziere > 0)) return false;
    if (f.onlyOverrun && !(p.depasireBugetMil && p.depasireBugetMil > 0))
      return false;
    const prog = p.progres ?? 0;
    if (prog < f.minProgres || prog > f.maxProgres) return false;
    return true;
  });
}

function HartaInner() {
  const search = useSearchParams();
  const focus = search.get("proiect");
  const [proiecte, setProiecte] = useState([] as ProiectMap[]);
  const [err, setErr] = useState(null as string | null);
  const [filters, setFilters] = useState(defaultMapFilters);

  useEffect(() => {
    fetch("/api/proiecte", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Nu s-au putut incarca proiectele");
        return r.json();
      })
      .then(setProiecte)
      .catch((e) => setErr(e.message));
  }, []);

  const filtered = useMemo(
    () => applyFilters(proiecte, filters),
    [proiecte, filters]
  );

  const statusOptions = useMemo(() => {
    const s = new Set(proiecte.map((p) => p.status));
    return Array.from(s).sort();
  }, [proiecte]);

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

  const legendActive: NivelRisc | "all" =
    filters.riscuri.length === 1 ? filters.riscuri[0] : "all";

  function onLegendFilter(v: NivelRisc | "all") {
    if (v === "all") {
      setFilters((f) => ({ ...f, riscuri: [] }));
      return;
    }
    setFilters((f) => ({
      ...f,
      riscuri: f.riscuri.includes(v)
        ? f.riscuri.filter((x) => x !== v)
        : [...f.riscuri, v],
    }));
  }

  if (err) return <p className="text-destructive">{err}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Harta</h1>
        <p className="text-muted-foreground mt-2">
          Filtrare avansata pe risc, status, intarzieri si depasiri.
        </p>
      </div>

      <MapFilters
        value={filters}
        onChange={setFilters}
        statusOptions={statusOptions}
        resultCount={filtered.length}
      />

      <LeafletMap proiecte={filtered} focusId={focus} />

      <RiscLegend
        activeFilter={legendActive}
        onFilterChange={onLegendFilter}
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
