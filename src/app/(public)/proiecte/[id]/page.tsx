"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";

type Proiect = {
  id: string;
  nume: string;
  status: string;
  localitate: string;
  valoare: string;
  progres: number;
  descriere: string;
  dataStart?: string | null;
  dataEstimata?: string | null;
  beneficiar?: string | null;
  categorie?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export default function ProiectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [proiect, setProiect] = useState(null as Proiect | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/proiecte/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProiect(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Eroare");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Se incarca...</p>;
  }

  if (error || !proiect) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Proiect negasit</p>
        <p className="text-xs text-muted-foreground font-mono break-all">
          id={id}
          {error ? ` · ${error}` : ""}
        </p>
        <Link href="/proiecte">
          <Button variant="outline">Inapoi la proiecte</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/proiecte"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Inapoi la proiecte
      </Link>

      <div>
        <p className="text-sm text-muted-foreground mb-1">{proiect.status}</p>
        <h1 className="text-3xl font-bold tracking-tight">{proiect.nume}</h1>
        {proiect.categorie && (
          <p className="text-sm text-muted-foreground mt-2">{proiect.categorie}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalii</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{proiect.descriere}</p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Localitate</dt>
              <dd className="font-medium">{proiect.localitate}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Valoare</dt>
              <dd className="font-medium">{proiect.valoare}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Progres</dt>
              <dd className="font-medium">{proiect.progres}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Beneficiar</dt>
              <dd className="font-medium">{proiect.beneficiar || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Start</dt>
              <dd className="font-medium">{proiect.dataStart || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estimare finalizare</dt>
              <dd className="font-medium">{proiect.dataEstimata || "—"}</dd>
            </div>
          </dl>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${proiect.progres}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {proiect.lat != null && proiect.lng != null && (
        <Link href={`/harta?proiect=${proiect.id}`}>
          <Button variant="secondary" className="gap-2">
            <MapPin className="size-4" />
            Vezi pe harta
          </Button>
        </Link>
      )}
    </div>
  );
}
