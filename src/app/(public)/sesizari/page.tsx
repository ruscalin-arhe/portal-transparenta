"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquareWarning, CheckCircle2 } from "lucide-react";

const schema = z.object({
  nume: z.string().min(2, "Numele trebuie sa aiba cel putin 2 caractere"),
  email: z.string().email("Email invalid"),
  telefon: z.string().optional(),
  subiect: z.string().min(3, "Subiectul este obligatoriu"),
  mesaj: z
    .string()
    .min(10, "Mesajul trebuie sa aiba cel putin 10 caractere")
    .max(2000, "Maxim 2000 de caractere"),
});

type FormData = z.infer<typeof schema>;

export default function SesizariPage() {
  const [successId, setSuccessId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      const res = await fetch("/api/sesizari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || "Eroare la trimitere");
        return;
      }
      setSuccessId(json.id);
      reset();
    } catch {
      setServerError("Nu s-a putut trimite sesizarea.");
    }
  }

  if (successId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center space-y-4 py-16"
      >
        <CheckCircle2 className="size-12 text-emerald-600 mx-auto" />
        <h1 className="text-2xl font-bold">Sesizare inregistrata</h1>
        <p className="text-muted-foreground">
          Numar de inregistrare: <strong>{successId}</strong>
        </p>
        <Button onClick={() => setSuccessId(null)} variant="outline">
          Trimite alta sesizare
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquareWarning className="size-7" />
          Sesizari
        </h1>
        <p className="text-muted-foreground mt-1">
          Trimite o sesizare publica legata de proiecte
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formular sesizare</CardTitle>
          <CardDescription>
            Campurile marcate cu * sunt obligatorii.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="nume">Nume complet *</Label>
              <Input id="nume" {...register("nume")} />
              {errors.nume && (
                <p className="text-xs text-destructive">{errors.nume.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon (optional)</Label>
              <Input id="telefon" type="tel" {...register("telefon")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subiect">Subiect *</Label>
              <Input id="subiect" {...register("subiect")} />
              {errors.subiect && (
                <p className="text-xs text-destructive">{errors.subiect.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mesaj">Mesaj *</Label>
              <textarea
                id="mesaj"
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("mesaj")}
              />
              {errors.mesaj && (
                <p className="text-xs text-destructive">{errors.mesaj.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Se trimite..." : "Trimite sesizarea"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
