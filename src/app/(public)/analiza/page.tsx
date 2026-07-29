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
} from "recharts";

const COLORS = ["#2563eb", "#f59e0b", "#16a34a", "#64748b"];

export default function AnalizaPage() {
  const { data, isLoading, isError } = useProiecte("all", "all");
  const proiecte = data || [];

  const stats = useMemo(() => {
    const total = proiecte.length;
    const byStatus: Record<string, number> = {};
    let sumaMil = 0;
    let progresSum = 0;

    for (const p of proiecte) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      progresSum += p.progres || 0;
      const m = p.valoare?.match(/([\d.,]+)/);
      if (m) {
        sumaMil += parseFloat(m[1].replace(",", ".")) || 0;
      }
    }

    const statusData = Object.entries(byStatus).map(([name, value]) => ({
      name,
      value,
    }));

    const progresData = proiecte.map((p) => ({
      name: p.localitate,
      progres: p.progres,
    }));

    return {
      total,
      sumaMil,
      progresMediu: total ? Math.round(progresSum / total) : 0,
      finalizate: byStatus["Finalizat"] || 0,
      inDerulare: byStatus["În derulare"] || 0,
      planificate: byStatus["Planificat"] || 0,
      statusData,
      progresData,
    };
  }, [proiecte]);

  function exportCsv() {
    const header = "id,nume,status,localitate,valoare,progres\n";
    const rows = proiecte
      .map(
        (p) =>
          `"${p.id}","${p.nume}","${p.status}","${p.localitate}","${p.valoare}",${p.progres}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proiecte-export.csv";
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
          <p className="text-muted-foreground mt-2">
            Indicatori agregati pe proiectele publice (date din baza de date)
          </p>
        </div>
        <Button type="button" variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total proiecte</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valoare estimata (mil. RON)</CardDescription>
            <CardTitle className="text-3xl">
              {stats.sumaMil.toFixed(1)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progres mediu</CardDescription>
            <CardTitle className="text-3xl">{stats.progresMediu}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Finalizate / In derulare / Planificate</CardDescription>
            <CardTitle className="text-xl">
              {stats.finalizate} / {stats.inDerulare} / {stats.planificate}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distributie pe status</CardTitle>
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
            <CardTitle className="text-base">Progres pe localitate</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.progresData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="progres" fill="#2563eb" name="Progres %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proiecte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {proiecte.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0"
            >
              <Link href={`/proiecte/${p.id}`} className="font-medium hover:underline">
                {p.nume}
              </Link>
              <span className="text-muted-foreground">
                {p.status} · {p.progres}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
