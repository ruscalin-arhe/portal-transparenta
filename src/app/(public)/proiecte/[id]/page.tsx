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
import { ArrowLeft, MapPin, FileText } from "lucide-react";

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
  bugetAlocatMil?: number | null;
  bugetCheltuitMil?: number | null;
  depasireBugetMil?: number | null;
  zileIntarziere?: number | null;
  progresFizic?: number | null;
  progresFinanciar?: number | null;
  risc?: string | null;
  sursaFinantare?: string | null;
  contractor?: string | null;
  ultimaActualizare?: string | null;
};

type Doc = {
  id: string;
  titlu: string;
  tip: string;
  url: string;
  data?: string | null;
};

export default function ProiectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [proiect, setProiect] = useState(null as Proiect | null);
  const [docs, setDocs] = useState([] as Doc[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/proiecte/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Proiect negasit");
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

  useEffect(() => {
    if (!proiect?.id) return;
    fetch(`/api/documente?proiect=${encodeURIComponent(proiect.id)}`)
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]));
  }, [proiect?.id]);

  if (loading) {
    return <p className="text-muted-foreground">Se incarca...</p>;
  }

  if (error || !proiect) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Proiect negasit</p>
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
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monitorizare</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Risc</dt>
            <dd className="font-medium">{proiect.risc || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Intarziere</dt>
            <dd className="font-medium">
              {proiect.zileIntarziere
                ? `${proiect.zileIntarziere} zile`
                : "La termen"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Buget alocat / cheltuit</dt>
            <dd className="font-medium">
              {proiect.bugetAlocatMil ?? "—"} / {proiect.bugetCheltuitMil ?? "—"}{" "}
              mil.
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Depasire</dt>
            <dd className="font-medium">
              {proiect.depasireBugetMil && proiect.depasireBugetMil > 0
                ? `+${proiect.depasireBugetMil} mil.`
                : "Fara depasire"}
            </dd>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" />
            Documente aferente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {docs.length === 0 && (
            <p className="text-muted-foreground">Niciun document legat.</p>
          )}
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap justify-between gap-2 border-b py-2 last:border-0"
            >
              <span>
                {d.titlu}{" "}
                <span className="text-muted-foreground">({d.tip})</span>
              </span>
              {d.url && d.url !== "#" ? (
                <a
                  href={d.url}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Deschide
                </a>
              ) : (
                <span className="text-muted-foreground">Indisponibil</span>
              )}
            </div>
          ))}
          <Link
            href="/documente"
            className="text-xs text-muted-foreground underline block pt-2"
          >
            Toate documentele →
          </Link>
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
