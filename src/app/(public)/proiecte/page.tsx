"use client";

import { useState } from "react";
import Link from "next/link";
import { useProiecte } from "@/hooks/use-proiecte";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FILTERS = [
  { value: "all", label: "Toate" },
  { value: "În derulare", label: "In derulare" },
  { value: "Planificat", label: "Planificat" },
  { value: "Finalizat", label: "Finalizat" },
];

export default function ProiectePage() {
  const [status, setStatus] = useState("all");
  const { data, isLoading, isError, isFetching } = useProiecte(status, "all");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proiecte</h1>
        <p className="text-muted-foreground mt-2">
          Lista publica a proiectelor de interes public
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={status === f.value ? "default" : "outline"}
            onClick={() => setStatus(f.value)}
            type="button"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {(isLoading || isFetching) && (
        <p className="text-muted-foreground text-sm">Se incarca...</p>
      )}
      {isError && <p className="text-destructive">Eroare la incarcare</p>}

      <div className="grid gap-4">
        {(data || []).map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex justify-between gap-4 flex-wrap">
                <CardTitle className="text-lg">
                  <Link href={`/proiecte/${p.id}`} className="hover:underline">
                    {p.nume}
                  </Link>
                </CardTitle>
                <span className="text-sm text-muted-foreground">{p.status}</span>
              </div>
              <CardDescription>
                {p.localitate} · {p.valoare}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${p.progres}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{p.progres}%</p>
              <Link href={`/proiecte/${p.id}`}>
                <Button variant="ghost" size="sm" className="px-0">
                  Detalii →
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {!isLoading && data?.length === 0 && (
          <p className="text-muted-foreground text-sm">Niciun proiect.</p>
        )}
      </div>
    </div>
  );
}
