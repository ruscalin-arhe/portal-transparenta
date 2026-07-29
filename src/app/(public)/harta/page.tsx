"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { ProiectMap } from "@/components/harta/leaflet-map";

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

  useEffect(() => {
    fetch("/api/proiecte", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Nu s-au putut incarca proiectele");
        return r.json();
      })
      .then(setProiecte)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-destructive">{err}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Harta</h1>
        <p className="text-muted-foreground mt-2">
          Localizare geospatiala a proiectelor. Culorile reflecta nivelul de risc.
          {focus ? (
            <span className="block text-sm mt-1">
              Focus: <code className="text-foreground">{focus}</code>
            </span>
          ) : null}
        </p>
      </div>
      <LeafletMap proiecte={proiecte} focusId={focus} />
      <p className="text-xs text-muted-foreground">
        Verde = risc scazut · Portocaliu = mediu · Rosu = ridicat. Din detaliu proiect
        foloseste „Vezi pe harta” pentru centrare automata pe pin.
      </p>
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
