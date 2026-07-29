"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

type Doc = {
  id: string;
  titlu: string;
  tip: string;
  data: string | null;
  dimensiune: string | null;
  url: string;
  proiectSlug: string | null;
  proiectNume: string | null;
};

export default function DocumentePage() {
  const [docs, setDocs] = useState([] as Doc[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    fetch("/api/documente", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Eroare incarcare");
        return r.json();
      })
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documente</h1>
        <p className="text-muted-foreground mt-2">
          Documente publice legate de proiecte sau de interes general
        </p>
      </div>

      {loading && <p className="text-muted-foreground">Se incarca...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="grid gap-3">
        {docs.map((d) => (
          <Card key={d.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <FileText className="size-5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{d.titlu}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.tip}
                    {d.data ? ` · ${d.data}` : ""}
                    {d.dimensiune ? ` · ${d.dimensiune}` : ""}
                  </p>
                  {d.proiectSlug && (
                    <p className="text-xs mt-1">
                      Proiect:{" "}
                      <Link
                        href={`/proiecte/${d.proiectSlug}`}
                        className="underline hover:text-foreground text-muted-foreground"
                      >
                        {d.proiectNume}
                      </Link>
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={d.url === "#" ? undefined : d.url} onClick={(e) => {
                    if (d.url === "#") e.preventDefault();
                  }}>
                    Descarca
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0" />
          </Card>
        ))}
        {!loading && docs.length === 0 && (
          <p className="text-muted-foreground text-sm">Niciun document.</p>
        )}
      </div>
    </div>
  );
}
