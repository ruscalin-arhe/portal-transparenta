"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, CheckCircle2, Clock, Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

type Proiect = {
  id: string;
  nume: string;
  status: string;
  localitate: string;
  progres?: number | null;
  progresFizic?: number | null;
  bugetAlocatMil?: number | null;
  bugetCheltuitMil?: number | null;
  lat?: number | null;
  lng?: number | null;
};

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#94a3b8", "#dc2626"];

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function classifyStatus(
  status: string
): "finalizat" | "derulare" | "planificat" | "altul" {
  const s = norm(status);
  if (s.includes("final")) return "finalizat";
  if (s.includes("derul") || s.includes("execut") || s.includes("ongoing"))
    return "derulare";
  if (s.includes("plan") || s.includes("pregat")) return "planificat";
  return "altul";
}

export default function DashboardPage() {
  const [proiecte, setProiecte] = useState<Proiect[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proiecte", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("API " + r.status);
        return r.json();
      })
      .then((data) => setProiecte(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = proiecte.length;
    let finalizate = 0;
    let derulare = 0;
    let planificat = 0;
    let altul = 0;
    let valoare = 0;
    let cheltuit = 0;
    let progresSum = 0;
    let progresN = 0;
    const byLoc = new Map<string, number>();

    for (const p of proiecte) {
      const c = classifyStatus(p.status || "");
      if (c === "finalizat") finalizate++;
      else if (c === "derulare") derulare++;
      else if (c === "planificat") planificat++;
      else altul++;

      const alocat = Number(p.bugetAlocatMil) || 0;
      const ch = Number(p.bugetCheltuitMil) || 0;
      valoare += alocat;
      cheltuit += ch;

      const pr = p.progresFizic ?? p.progres;
      if (pr != null && Number.isFinite(Number(pr))) {
        progresSum += clampPct(Number(pr));
        progresN++;
      }

      const loc = (p.localitate || "Nespecificat").trim() || "Nespecificat";
      byLoc.set(loc, (byLoc.get(loc) || 0) + alocat);
    }

    const pct = (n: number) =>
      total === 0
        ? "0%"
        : (Math.round((n / total) * 1000) / 10).toFixed(1) + "%";

    const statusData = [
      { name: "Finalizat", value: finalizate },
      { name: "În derulare", value: derulare },
      { name: "Planificat", value: planificat },
      ...(altul ? [{ name: "Altele", value: altul }] : []),
    ].filter((d) => d.value > 0);

    const judeteData = Array.from(byLoc.entries())
      .map(([name, valoare]) => ({
        name,
        valoare: Math.round(valoare * 10) / 10,
      }))
      .sort((a, b) => b.valoare - a.valoare)
      .slice(0, 8);

    return {
      total,
      finalizate,
      derulare,
      planificat,
      valoare: Math.round(valoare * 10) / 10,
      cheltuit: Math.round(cheltuit * 10) / 10,
      progresMediu: progresN
        ? Math.round((progresSum / progresN) * 10) / 10
        : 0,
      pctFinalizate: pct(finalizate),
      pctDerulare: pct(derulare),
      statusData,
      judeteData,
    };
  }, [proiecte]);

  const cards = [
    {
      title: "Proiecte totale",
      value: String(stats.total),
      icon: FolderKanban,
      description: "publicate",
    },
    {
      title: "Finalizate",
      value: String(stats.finalizate),
      icon: CheckCircle2,
      description: stats.pctFinalizate,
    },
    {
      title: "În derulare",
      value: String(stats.derulare),
      icon: Clock,
      description: stats.pctDerulare,
    },
    {
      title: "Valoare totală",
      value: String(stats.valoare),
      icon: Wallet,
      description: "mil. RON alocat",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Prezentare generală a progresului și datelor financiare (din proiecte
          publicate).
        </p>
      </div>

      {loading && <p className="text-muted-foreground">Se încarcă...</p>}
      {error && <p className="text-destructive">Eroare: {error}</p>}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <Card key={c.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {c.title}
                  </CardTitle>
                  <c.icon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{c.value}</div>
                  <p className="text-muted-foreground text-xs">
                    {c.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-muted-foreground text-sm">
            Progres fizic mediu: <strong>{stats.progresMediu}%</strong>
            {" · "}
            Cheltuit: <strong>{stats.cheltuit} mil. RON</strong>
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progres pe status</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {stats.statusData.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nu există date.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.statusData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valoare pe localități (mil. RON)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {stats.judeteData.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nu există date.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.judeteData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar
                        dataKey="valoare"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
