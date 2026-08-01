"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Row = {
  id: string;
  path: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  referer: string | null;
  isAdmin: boolean;
  userId: string | null;
  createdAt: string;
};

export default function AdminTraficPage() {
  const [scope, setScope] = useState("all");
  const [data, setData] = useState<{
    total: number;
    recent: Row[];
    byPath: { path: string; _count: number }[];
    byCountry: { country: string | null; _count: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(s = scope) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/trafic?scope=${s}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("Neautorizat — /login");
        return;
      }
      if (!res.ok) throw new Error("Eroare incarcare");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    }
  }

  useEffect(() => {
    load(scope);
  }, [scope]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin · Trafic</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Accesări recente (publice + admin). IP/țară depind de proxy/CDN.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "public", "admin"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={scope === s ? "default" : "outline"}
            onClick={() => setScope(s)}
          >
            {s}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => load(scope)}>
          Refresh
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {data && (
        <p className="text-muted-foreground text-sm">Total: {data.total}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top pagini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data?.byPath?.map((r) => (
              <div key={r.path} className="flex justify-between gap-2">
                <span className="truncate">{r.path}</span>
                <span className="text-muted-foreground">{r._count}</span>
              </div>
            )) || <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top țări</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data?.byCountry?.map((r, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>{r.country || "necunoscut"}</span>
                <span className="text-muted-foreground">{r._count}</span>
              </div>
            )) || <p className="text-muted-foreground">—</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ultimele accesări</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data?.recent?.map((r) => (
            <div key={r.id} className="border-border/50 border-b pb-2">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{r.path}</span>
                <span className="text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("ro-RO")}
                </span>
              </div>
              <div className="text-muted-foreground text-xs">
                {r.isAdmin ? "admin" : "public"}
                {r.country ? ` · ${r.country}` : ""}
                {r.city ? `/${r.city}` : ""}
                {r.ip ? ` · ${r.ip}` : ""}
                {r.userId ? ` · ${r.userId}` : ""}
              </div>
            </div>
          )) || <p className="text-muted-foreground">Nicio accesare.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
