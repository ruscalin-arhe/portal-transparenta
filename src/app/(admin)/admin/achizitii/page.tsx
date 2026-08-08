"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Tender = {
  id: string;
  externalId: string | null;
  title: string;
  cpvMain: string | null;
  valueEstimated: number | null;
  valueCurrency: string | null;
  contractingAuthority: string | null;
  status: string | null;
  publicationDate: string | null;
  published: boolean;
};

export default function AdminAchizitiiPage() {
  const [lista, setLista] = useState<Tender[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin vede tot (inclusiv unpublished) – folosim API public + filtru local sau endpoint admin
      // Pentru simplitate: folosim /api/achizitii (published) + un fetch admin separat mai târziu
      const res = await fetch("/api/achizitii?take=100", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setError("Neautorizat — /login");
        return;
      }
      if (!res.ok) {
        setError("HTTP " + res.status);
        return;
      }
      const json = await res.json();
      setLista(json.data || []);
      setTotal(json.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin · Achiziții</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tender / SICAP — {total} înregistrări
        </p>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Se încarcă...</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={load}>
          Reîncarcă
        </Button>
      </div>

      <div className="space-y-3">
        {lista.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base leading-snug">
                {t.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p>
                CPV: {t.cpvMain ?? "-"} ·{" "}
                {t.valueEstimated != null
                  ? t.valueEstimated.toLocaleString("ro-RO") +
                    " " +
                    (t.valueCurrency || "RON")
                  : "-"}
              </p>
              <p>Autoritate: {t.contractingAuthority ?? "-"}</p>
              <p>
                Status: {t.status ?? "-"} · Publicat:{" "}
                {t.publicationDate
                  ? new Date(t.publicationDate).toLocaleDateString("ro-RO")
                  : "-"}
              </p>
              <p className="text-xs">ID: {t.externalId ?? t.id}</p>
            </CardContent>
          </Card>
        ))}
        {!loading && lista.length === 0 && (
          <p className="text-muted-foreground text-sm">Niciun tender încă.</p>
        )}
      </div>
    </div>
  );
}
