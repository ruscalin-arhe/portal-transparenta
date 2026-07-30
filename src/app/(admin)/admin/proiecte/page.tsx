"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Proiect = {
  id: string;
  slug: string;
  nume: string;
  status: string;
  progres: number;
  zileIntarziere: number;
  bugetAlocatMil: number | null;
  bugetCheltuitMil: number | null;
  depasireBugetMil: number | null;
  progresFizic: number | null;
  progresFinanciar: number | null;
  risc: string | null;
  contractor: string | null;
  sursaFinantare: string | null;
  ultimaActualizare: string | null;
  published: boolean;
};

export default function AdminProiectePage() {
  const [lista, setLista] = useState([] as Proiect[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [saving, setSaving] = useState(null as string | null);
  const [msg, setMsg] = useState(null as string | null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/proiecte", { cache: "no-store" });
      if (res.status === 401) {
        setError("Neautorizat — autentifica-te la /login");
        return;
      }
      if (!res.ok) throw new Error("Eroare incarcare");
      setLista(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateLocal(id: string, field: keyof Proiect, value: string | number | boolean | null) {
    setLista((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function save(p: Proiect) {
    setSaving(p.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/proiecte/${p.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: p.status,
          progres: Number(p.progres),
          zileIntarziere: Number(p.zileIntarziere),
          bugetAlocatMil: p.bugetAlocatMil,
          bugetCheltuitMil: p.bugetCheltuitMil,
          depasireBugetMil: p.depasireBugetMil,
          progresFizic: p.progresFizic,
          progresFinanciar: p.progresFinanciar,
          risc: p.risc,
          contractor: p.contractor,
          sursaFinantare: p.sursaFinantare,
          ultimaActualizare: p.ultimaActualizare,
          published: p.published,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Salvare esuata");
      }
      setMsg(`Salvat: ${p.nume}`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Eroare salvare");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Se incarca proiectele...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin · Proiecte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Actualizeaza progres, intarzieri, risc si date financiare
        </p>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <div className="space-y-4">
        {lista.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{p.nume}</CardTitle>
              <p className="text-xs text-muted-foreground">{p.slug}</p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Input
                  value={p.status}
                  onChange={(e) => updateLocal(p.id, "status", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Progres %</Label>
                <Input
                  type="number"
                  value={p.progres}
                  onChange={(e) =>
                    updateLocal(p.id, "progres", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Zile intarziere</Label>
                <Input
                  type="number"
                  value={p.zileIntarziere}
                  onChange={(e) =>
                    updateLocal(p.id, "zileIntarziere", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Risc</Label>
                <select
                  className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={p.risc || "nespecificat"}
                  onChange={(e) =>
                    updateLocal(
                      p.id,
                      "risc",
                      e.target.value === "nespecificat" ? null : e.target.value
                    )
                  }
                >
                  <option value="scazut">scazut</option>
                  <option value="mediu">mediu</option>
                  <option value="ridicat">ridicat</option>
                  <option value="nespecificat">nespecificat</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Buget alocat (mil.)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={p.bugetAlocatMil ?? ""}
                  onChange={(e) =>
                    updateLocal(
                      p.id,
                      "bugetAlocatMil",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Buget cheltuit (mil.)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={p.bugetCheltuitMil ?? ""}
                  onChange={(e) =>
                    updateLocal(
                      p.id,
                      "bugetCheltuitMil",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Depasire buget (mil.)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={p.depasireBugetMil ?? ""}
                  onChange={(e) =>
                    updateLocal(
                      p.id,
                      "depasireBugetMil",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Progres fizic %</Label>
                <Input
                  type="number"
                  value={p.progresFizic ?? ""}
                  onChange={(e) =>
                    updateLocal(
                      p.id,
                      "progresFizic",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Progres financiar %</Label>
                <Input
                  type="number"
                  value={p.progresFinanciar ?? ""}
                  onChange={(e) =>
                    updateLocal(
                      p.id,
                      "progresFinanciar",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Ultima actualizare</Label>
                <Input
                  value={p.ultimaActualizare ?? ""}
                  onChange={(e) =>
                    updateLocal(p.id, "ultimaActualizare", e.target.value || null)
                  }
                  placeholder="ex. 30.07.2026"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => save(p)}
                  disabled={saving === p.id}
                >
                  {saving === p.id ? "Se salveaza..." : "Salveaza"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
