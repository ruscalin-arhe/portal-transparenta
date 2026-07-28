"use client";

import Link from "next/link";
import { use } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  Activity,
  Map,
} from "lucide-react";
import { getProiectById } from "@/lib/data/proiecte";

export default function ProiectDetaliuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const proiect = getProiectById(id);

  if (!proiect) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Proiect negăsit</h2>
        <Link href="/proiecte" className="mt-4 inline-block">
          <Button variant="outline">Înapoi la listă</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl"
    >
      <div>
        <Link href="/proiecte">
          <Button variant="ghost" size="sm" className="gap-2 mb-4 -ml-2">
            <ArrowLeft className="size-4" />
            Înapoi la proiecte
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{proiect.nume}</h1>
        <p className="text-muted-foreground mt-2">{proiect.descriere}</p>
      </div>

      <div className="flex gap-3">
        <Link href={`/harta?proiect=${proiect.id}`}>
          <Button className="gap-2">
            <Map className="size-4" />
            Vezi pe hartă
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="size-4" /> Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{proiect.status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="size-4" /> Valoare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{proiect.valoare}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="size-4" /> Locație
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{proiect.localitate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="size-4" /> Perioadă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {proiect.dataStart} – {proiect.dataEstimata}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progres fizic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Realizat</span>
            <span className="font-medium">{proiect.progres}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${proiect.progres}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Beneficiar:</span>{" "}
          {proiect.beneficiar}
        </p>
      </div>
    </motion.div>
  );
}
