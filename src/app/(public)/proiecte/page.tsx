"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, MapPin, Calendar, Map } from "lucide-react";
import { proiecte } from "@/lib/data/proiecte";

const statusColor: Record<string, string> = {
  "În derulare": "bg-blue-100 text-blue-800",
  Planificat: "bg-amber-100 text-amber-800",
  Finalizat: "bg-emerald-100 text-emerald-800",
};

export default function ProiectePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proiecte</h1>
          <p className="text-muted-foreground mt-1">
            Lista publică a proiectelor din Coridorul Verde-Digital
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FolderKanban className="size-4" />
          Filtrează
        </Button>
      </div>

      <div className="grid gap-4">
        {proiecte.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg leading-snug">
                    {p.nume}
                  </CardTitle>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {p.localitate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {p.valoare}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>Progres</span>
                    <span className="font-medium">{p.progres}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${p.progres}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href={`/proiecte/${p.id}`}>
                    <Button variant="ghost" size="sm" className="px-0">
                      Vezi detalii →
                    </Button>
                  </Link>
                  <Link href={`/harta?proiect=${p.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Map className="size-3.5" />
                      Pe hartă
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
