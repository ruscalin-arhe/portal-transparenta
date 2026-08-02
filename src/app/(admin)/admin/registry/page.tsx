"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Org = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  published: boolean;
  _count?: { dataSources: number };
};

type Ds = {
  id: string;
  slug: string;
  name: string;
  type: string;
  channel: string;
  active: boolean;
  lastRunAt: string | null;
  organization?: { slug: string; name: string };
  _count?: { runs: number };
};

type Run = {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  recordsTotal: number | null;
  recordsOk: number | null;
  recordsError: number | null;
  sourceFile: string | null;
  dataSource?: { slug: string; name: string };
  _count?: { pnrrPlati: number };
};

export default function AdminRegistryPage() {
  const [orgs, setOrgs] = useState([] as Org[]);
  const [sources, setSources] = useState([] as Ds[]);
  const [runs, setRuns] = useState([] as Run[]);
  const [error, setError] = useState(null as string | null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch("/api/admin/organizations", { cache: "no-store" }),
          fetch("/api/admin/data-sources", { cache: "no-store" }),
          fetch("/api/admin/data-runs", { cache: "no-store" }),
        ]);
        if (r1.status === 401 || r2.status === 401 || r3.status === 401) {
          setError("Neautorizat — /login");
          return;
        }
        if (!r1.ok || !r2.ok || !r3.ok) {
          setError("Eroare la incarcare API registry");
          return;
        }
        setOrgs(await r1.json());
        setSources(await r2.json());
        setRuns(await r3.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Eroare");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin · Registry</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Organization / DataSource / DataRun (read-only)
        </p>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Se incarca...</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Organizations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {orgs.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {o.shortName || o.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-1 text-sm">
                <p>slug: {o.slug}</p>
                <p>{o.name}</p>
                <p>sources: {o._count?.dataSources ?? "-"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data sources</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-1 text-sm">
                <p>slug: {s.slug}</p>
                <p>
                  type: {s.type} · channel: {s.channel}
                </p>
                <p>org: {s.organization?.slug ?? "-"}</p>
                <p>runs: {s._count?.runs ?? "-"}</p>
                <p>
                  lastRun:{" "}
                  {s.lastRunAt
                    ? new Date(s.lastRunAt).toLocaleString("ro-RO")
                    : "-"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data runs (ultimele)</h2>
        <div className="space-y-2">
          {runs.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-1 py-3 text-sm">
                <p className="font-medium">
                  {r.dataSource?.slug ?? "?"} · {r.status}
                </p>
                <p className="text-muted-foreground">
                  total={r.recordsTotal ?? "-"} ok={r.recordsOk ?? "-"} err=
                  {r.recordsError ?? "-"} · plati={r._count?.pnrrPlati ?? "-"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {r.sourceFile || r.id}
                </p>
              </CardContent>
            </Card>
          ))}
          {!loading && runs.length === 0 && (
            <p className="text-muted-foreground text-sm">Niciun run inca.</p>
          )}
        </div>
      </section>
    </div>
  );
}
