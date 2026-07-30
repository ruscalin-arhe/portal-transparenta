"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProiecte } from "@/hooks/use-proiecte";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#dc2626", "#64748b"];

function median(nums: number[]) {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function mean(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

type P = {
  id: string;
  nume: string;
  status: string;
  localitate: string;
  progres: number;
  categorie?: string | null;
  bugetAlocatMil?: number | null;
  bugetCheltuitMil?: number | null;
  depasireBugetMil?: number | null;
  zileIntarziere?: number | null;
  progresFizic?: number | null;
  progresFinanciar?: number | null;
  risc?: string | null;
};

export default function AnalizaPage() {
  const { data, isLoading, isError } = useProiecte("all", "all");
  const proiecte = (data || []) as P[];

  const stats = useMemo(() => {
    const total = proiecte.length;
    const delays = proiecte.map((p) => p.zileIntarziere ?? 0);
    const withDelay = proiecte.filter((p) => (p.zileIntarziere ?? 0) > 0);
    const overruns = proiecte.filter((p) => (p.depasireBugetMil ?? 0) > 0);

    const alocat = proiecte.reduce((s, p) => s + (p.bugetAlocatMil ?? 0), 0);
    const cheltuit = proiecte.reduce(
      (s, p) => s + (p.bugetCheltuitMil ?? 0),
      0
    );
    const overrunSum = proiecte.reduce(
      (s, p) => s + Math.max(0, p.depasireBugetMil ?? 0),
      0
    );

    const gaps = proiecte.map((p) => {
      const fiz = p.progresFizic ?? p.progres ?? 0;
      const fin = p.progresFinanciar ?? 0;
      return { id: p.id, nume: p.nume, gap: fin - fiz, fiz, fin };
    });

    const byStatus: Record<string, number> = {};
    const byCat: Record<string, number> = {};

    for (const p of proiecte) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      const cat = p.categorie || "Altele";
      byCat[cat] = (byCat[cat] || 0) + (p.bugetAlocatMil ?? 0);
    }

    const scatter = proiecte.map((p) => ({
      x: p.progres ?? 0,
      y: p.bugetCheltuitMil ?? 0,
      z: Math.max(1, p.zileIntarziere ?? 1),
    }));

    const delayBars = proiecte.map((p) => ({
      name: p.localitate.slice(0, 12),
      zile: p.zileIntarziere ?? 0,
      overrun: p.depasireBugetMil ?? 0,
    }));

    return {
      total,
      alocat,
      cheltuit,
      overrunSum,
      pctOverrun: alocat ? (overrunSum / alocat) * 100 : 0,
      pctDelayed: total ? (withDelay.length / total) * 100 : 0,
      meanDelay: mean(delays),
      medianDelay: median(delays),
      maxDelay: delays.length ? Math.max(...delays) : 0,
      nDelayed: withDelay.length,
      nOverrun: overruns.length,
      absorbtie: alocat ? (cheltuit / alocat) * 100 : 0,
      statusData: Object.entries(byStatus).map(([name, value]) => ({
        name,
        value,
      })),
      catData: Object.entries(byCat).map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      })),
      scatter,
      delayBars,
      gaps: gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)),
      topDelayed: [...proiecte]
        .sort((a, b) => (b.zileIntarziere ?? 0) - (a.zileIntarziere ?? 0))
        .slice(0, 5),
    };
  }, [proiecte]);

  function exportCsv() {
    const header =
      "id,nume,status,localitate,progres,zileIntarziere,bugetAlocat,bugetCheltuit,depasire,risc\n";
    const rows = proiecte
      .map(
        (p) =>
          `"${p.id}","${p.nume}","${p.status}","${p.localitate}",${p.progres},${p.zileIntarziere ?? 0},${p.bugetAlocatMil ?? ""},${p.bugetCheltuitMil ?? ""},${p.depasireBugetMil ?? ""},"${p.risc ?? ""}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analiza-proiecte.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Se incarca analiza...</p>;
  }
  if (isError) {
    return <p className="text-destructive">Eroare la incarcarea datelor</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analiza</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Indicatori de performanta, intarzieri, depasiri de buget si distributii.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Proiecte</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absorbtie (cheltuit / alocat)</CardDescription>
            <CardTitle className="text-3xl">
              {stats.absorbtie.toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {stats.cheltuit.toFixed(1)} / {stats.alocat.toFixed(1)} mil. RON
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>% cu intarziere</CardDescription>
            <CardTitle className="text-3xl">
              {stats.pctDelayed.toFixed(0)}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            n={stats.nDelayed} · medie {stats.meanDelay.toFixed(0)} · mediana{" "}
            {stats.medianDelay.toFixed(0)} · max {stats.maxDelay}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Depasire buget (suma mil.)</CardDescription>
            <CardTitle className="text-3xl">
              {stats.overrunSum.toFixed(1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {stats.pctOverrun.toFixed(1)}% din alocat · n={stats.nOverrun}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intarzieri si depasiri</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.delayBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="zile" name="Zile intarziere" fill="#f59e0b" />
                <Bar dataKey="overrun" name="Depasire mil." fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progres vs. buget cheltuit</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Progres"
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis type="number" dataKey="y" name="Cheltuit" unit=" mil" />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={stats.scatter} fill="#2563eb" name="Proiecte" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distributie status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buget pe categorie</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.catData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="value" name="mil. RON" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gap financiar - fizic (p.p.)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {stats.gaps.map((g) => (
              <div
                key={g.id}
                className="flex justify-between gap-2 border-b py-2"
              >
                <Link href={`/proiecte/${g.id}`} className="hover:underline">
                  {g.nume}
                </Link>
                <span>
                  {g.gap > 0 ? "+" : ""}
                  {g.gap} (F{g.fin}/P{g.fiz})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top intarzieri</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {stats.topDelayed.map((p) => (
              <div
                key={p.id}
                className="flex justify-between gap-2 border-b py-2"
              >
                <Link href={`/proiecte/${p.id}`} className="hover:underline">
                  {p.nume}
                </Link>
                <span>{p.zileIntarziere ?? 0} zile</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
