"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Plata = {
  id: string;
  componenta: string | null;
  investitie: string | null;
  beneficiar: string | null;
  suma: number | null;
  moneda: string | null;
  dataPlata: string | null;
  judet: string | null;
  sourceUrl: string;
};

type Payload = {
  meta: {
    total: number;
    sumaTotala: number;
    note: string;
    dataSource?: {
      name: string | null;
      sourceUrl: string | null;
      lastRunAt: string | null;
      lastRun: {
        id: string;
        finishedAt: string | null;
        recordsOk: number | null;
        recordsTotal: number | null;
      } | null;
    } | null;
  };
  byJudet: {
    judet: string | null;
    _sum: { suma: number | null };
    _count: number;
  }[];
  recent: Plata[];
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function freshnessBadge(lastRunAt: string | null | undefined) {
  if (!lastRunAt) return { text: "Fără date", className: "bg-muted text-muted-foreground" };
  const days = (Date.now() - new Date(lastRunAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 14) return { text: `Actualizat ${formatDate(lastRunAt)}`, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" };
  if (days <= 45) return { text: `Actualizat ${formatDate(lastRunAt)}`, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
  return { text: `Vechi · ${formatDate(lastRunAt)}`, className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
}

function formatSuma(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 0,
  }).format(n);
}

export default function PnrrPage() {
  const [data, setData] = useState(null as Payload | null);
  const [judet, setJudet] = useState("");
  const [error, setError] = useState(null as string | null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = judet ? `?judet=${encodeURIComponent(judet)}` : "";
    fetch(`/api/pnrr/plati${q}`, { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Eroare");
        return body as Payload;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [judet]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PNRR · Plati</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Plati / alocari din surse publice importate (Open Data / fisiere
          oficiale). Fiecare rand pastreaza linkul sursei.
        </p>
        {data?.meta?.dataSource && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(() => {
              const badge = freshnessBadge(
                data.meta.dataSource.lastRun?.finishedAt ?? data.meta.dataSource.lastRunAt
              );
              return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                  {badge.text}
                </span>
              );
            })()}
            {data.meta.dataSource.lastRun?.recordsOk != null && (
              <span className="text-muted-foreground text-xs">
                {data.meta.dataSource.lastRun.recordsOk} înregistrări din ultimul run
              </span>
            )}
          </div>
        )}
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Filtreaza dupa judet..."
          value={judet}
          onChange={(e) => setJudet(e.target.value)}
        />
      </div>

      {loading && <p className="text-muted-foreground">Se incarca...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Numar inregistrari</CardDescription>
                <CardTitle className="text-3xl">{data.meta.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Suma totala (din camp suma)</CardDescription>
                <CardTitle className="text-3xl">
                  {formatSuma(data.meta.sumaTotala)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">{data.meta.note}</p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pe judet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {data.byJudet.map((j, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-2 border-b py-2 last:border-0"
                >
                  <span>{j.judet || "Nespecificat"}</span>
                  <span className="text-muted-foreground">
                    {j._count} · {formatSuma(j._sum.suma)}
                  </span>
                </div>
              ))}
              {data.byJudet.length === 0 && (
                <p className="text-muted-foreground">Nicio agregare.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inregistrari recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.recent.map((p) => (
                <div key={p.id} className="border-b pb-3 last:border-0 space-y-1">
                  <p className="font-medium">
                    {p.investitie || p.componenta || "Fara titlu"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {[p.componenta, p.judet, p.beneficiar, p.dataPlata]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p>
                    {formatSuma(p.suma)} {p.moneda || "RON"}
                    {" · "}
                    <a
                      href={p.sourceUrl}
                      className="underline text-xs"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sursa
                    </a>
                  </p>
                </div>
              ))}
              {data.recent.length === 0 && (
                <p className="text-muted-foreground">
                  Nicio plata importata. Ruleaza scriptul de import.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
