"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  procedureType: string | null;
  published: boolean;
};

export default function AdminAchizitiiPage() {
  const [lista, setLista] = useState<Tender[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (query = q) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ take: "100" });
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch("/api/admin/achizitii?" + params, {
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
    },
    [q]
  );

  useEffect(() => {
    load("");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin · Achiziții</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          SEAP / SICAP — {total.toLocaleString("ro-RO")} înregistrări
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="caută titlu, CPV, autoritate, nr. anunț…"
          className="max-w-md"
          onKeyDown={(e) => e.key === "Enter" && load(q)}
        />
        <Button type="button" size="sm" onClick={() => load(q)}>
          Caută
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => load("")}
        >
          Reset
        </Button>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Se încarcă...</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}

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
                CPV: {t.cpvMain ?? "—"} ·{" "}
                {t.valueEstimated != null
                  ? t.valueEstimated.toLocaleString("ro-RO") +
                    " " +
                    (t.valueCurrency || "RON")
                  : "—"}
              </p>
              <p>Autoritate: {t.contractingAuthority ?? "—"}</p>
              <p>
                {t.status ?? "—"}
                {t.procedureType ? ` · ${t.procedureType}` : ""}
                {t.publicationDate
                  ? ` · ${new Date(t.publicationDate).toLocaleDateString("ro-RO")}`
                  : ""}
              </p>
              <p className="text-xs">
                {t.externalId ?? t.id} · published={String(t.published)}
              </p>
            </CardContent>
          </Card>
        ))}
        {!loading && lista.length === 0 && (
          <p className="text-muted-foreground text-sm">Niciun tender.</p>
        )}
      </div>
    </div>
  );
}
