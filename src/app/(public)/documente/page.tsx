"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
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
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) {
          throw new Error(body.detail || body.error || "Eroare incarcare");
        }
        return body as Doc[];
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
      {error && (
        <p className="text-destructive text-sm">
          Eroare incarcare{error ? `: ${error}` : ""}
        </p>
      )}

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
                        className="underline text-muted-foreground hover:text-foreground"
                      >
                        {d.proiectNume}
                      </Link>
                    </p>
                  )}
                </div>
                {d.url && d.url !== "#" ? (
                  <a href={d.url} target="_blank" rel="noreferrer">
                    <Button type="button" variant="outline" size="sm">
                      Descarca
                    </Button>
                  </a>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Indisponibil
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
        {!loading && !error && docs.length === 0 && (
          <p className="text-muted-foreground text-sm">Niciun document.</p>
        )}
      </div>
    </div>
  );
}
