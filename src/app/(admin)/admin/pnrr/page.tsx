"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  id: string;
  componenta: string | null;
  investitie: string | null;
  beneficiar: string | null;
  suma: number | null;
  judet: string | null;
  dataPlata: string | null;
  sourceUrl: string;
  dataStatus: string;
  completenessScore: number;
  validationReport: string | null;
  published: boolean;
  dataRunId?: string | null;
};

export default function AdminPnrrPage() {
  const [status, setStatus] = useState("INSUFFICIENT_DATA");
  const [dataRunId, setDataRunId] = useState("");
  const [runs, setRuns] = useState(
    [] as {
      id: string;
      status: string;
      sourceFile: string | null;
      createdAt: string;
    }[]
  );
  const [lista, setLista] = useState([] as Row[]);
  const [counts, setCounts] = useState(
    [] as { dataStatus: string; _count: number }[]
  );
  const [error, setError] = useState(null as string | null);
  const [msg, setMsg] = useState(null as string | null);
  const [loading, setLoading] = useState(true);

  async function load(st = status, runId = dataRunId) {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ status: st });
      if (runId) q.set("dataRunId", runId);
      const res = await fetch(`/api/admin/pnrr?${q}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setError("Neautorizat — /login");
        return;
      }
      if (!res.ok) {
        setError(
          `HTTP ${res.status}: ${data.error || data.detail || "Eroare"}`
        );
        return;
      }
      setLista(data.lista || []);
      setCounts(data.counts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch("/api/admin/data-runs", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setRuns(d.slice(0, 30));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load(status, dataRunId);
  }, [status, dataRunId]);

  function updateLocal(
    id: string,
    field: keyof Row,
    value: string | number | null
  ) {
    setLista((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  async function save(r: Row, forceStatus?: string) {
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/pnrr/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componenta: r.componenta,
          investitie: r.investitie,
          beneficiar: r.beneficiar,
          suma: r.suma,
          judet: r.judet,
          dataPlata: r.dataPlata,
          sourceUrl: r.sourceUrl,
          forceStatus,
        }),
      });
      if (!res.ok) throw new Error("Salvare esuata");
      setMsg("Salvat");
      await load(status);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Admin · Coada PNRR
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Inregistrari cu date lipsa sau insuficiente — completare si validare
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {counts.map((c) => (
          <span key={c.dataStatus} className="rounded border px-2 py-1">
            {c.dataStatus}: {c._count}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-muted-foreground text-sm">DataRun:</label>
        <select
          className="border-input bg-background rounded-md border px-2 py-1 text-sm"
          value={dataRunId}
          onChange={(e) => {
            setMsg(null);
            setDataRunId(e.target.value);
          }}
        >
          <option value="">toate</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.status} · {(r.sourceFile || r.id).slice(-40)} ·{" "}
              {new Date(r.createdAt).toLocaleString("ro-RO")}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            "MISSING_DATA",
            "INSUFFICIENT_DATA",
            "COMPLETE",
            "VALIDATED",
            "all",
          ] as const
        ).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => {
              setMsg(null);
              setStatus(s);
            }}
          >
            {s}
          </Button>
        ))}
      </div>

      {msg && <p className="text-muted-foreground text-sm">{msg}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {loading && (
        <p className="text-muted-foreground text-sm">Se incarca...</p>
      )}

      <div className="space-y-4">
        {lista.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {r.investitie || r.componenta || "Fara titlu"}
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                {r.dataStatus} · scor {r.completenessScore}%{" · "}
                <a
                  href={r.sourceUrl}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Sursa
                </a>
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Investitie</Label>
                <Input
                  value={r.investitie ?? ""}
                  onChange={(e) =>
                    updateLocal(r.id, "investitie", e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Componenta</Label>
                <Input
                  value={r.componenta ?? ""}
                  onChange={(e) =>
                    updateLocal(r.id, "componenta", e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Judet</Label>
                <Input
                  value={r.judet ?? ""}
                  onChange={(e) =>
                    updateLocal(r.id, "judet", e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Beneficiar</Label>
                <Input
                  value={r.beneficiar ?? ""}
                  onChange={(e) =>
                    updateLocal(r.id, "beneficiar", e.target.value || null)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Suma</Label>
                <Input
                  type="number"
                  value={r.suma ?? ""}
                  onChange={(e) =>
                    updateLocal(
                      r.id,
                      "suma",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Data plata</Label>
                <Input
                  value={r.dataPlata ?? ""}
                  onChange={(e) =>
                    updateLocal(r.id, "dataPlata", e.target.value || null)
                  }
                />
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Button type="button" size="sm" onClick={() => save(r)}>
                  Revalideaza & salveaza
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => save(r, "VALIDATED")}
                >
                  Marcheaza validat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && lista.length === 0 && (
          <p className="text-muted-foreground text-sm">Nicio inregistrare.</p>
        )}
      </div>
    </div>
  );
}
