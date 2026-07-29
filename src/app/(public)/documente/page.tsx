"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import { useDocumente } from "@/hooks/use-documente";

export default function DocumentePage() {
  const { data: documente = [], isLoading, isError } = useDocumente();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documente</h1>
        <p className="text-muted-foreground mt-1">
          Documente oficiale si rapoarte publice
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Se incarca documentele...</p>
      )}
      {isError && (
        <p className="text-sm text-destructive">Eroare la incarcarea documentelor.</p>
      )}

      <div className="grid gap-3">
        {documente.map((doc, i) => {
          const Icon = doc.tip === "XLSX" ? FileSpreadsheet : FileText;
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.titlu}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.tip} · {doc.dimensiune} · {doc.data}
                    </p>
                  </div>
                  <a href={doc.url}>
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                      <Download className="size-3.5" />
                      Descarca
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
