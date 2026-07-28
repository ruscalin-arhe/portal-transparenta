"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Map, BarChart3, FileText, MessageSquareWarning } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

export default function HomePage() {
  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="text-center space-y-6 py-10">
        <motion.h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Portal Public de Transparență
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Vizualizare publică a proiectelor, progresului și datelor financiare.
        </motion.p>
        <motion.div
          className="flex flex-wrap justify-center gap-4 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <Link href="/proiecte">
            <Button size="lg" className="px-8 gap-2">
              <FolderKanban className="size-4" />
              Vezi proiecte
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="px-8 gap-2">
              <BarChart3 className="size-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/harta">
            <Button size="lg" variant="secondary" className="px-8 gap-2">
              <Map className="size-4" />
              Hartă interactivă
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Proiecte",
            desc: "Listă și detalii despre proiectele din coridor",
            href: "/proiecte",
            icon: FolderKanban,
          },
          {
            title: "Hartă",
            desc: "Vizualizare interactivă pe hartă a coridorului",
            href: "/harta",
            icon: Map,
          },
          {
            title: "Dashboard",
            desc: "Date financiare și progres actualizate public",
            href: "/dashboard",
            icon: BarChart3,
          },
          {
            title: "Documente",
            desc: "Documente oficiale și rapoarte publice",
            href: "/documente",
            icon: FileText,
          },
          {
            title: "Sesizări",
            desc: "Trimite sesizări și urmărește statusul",
            href: "/sesizari",
            icon: MessageSquareWarning,
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <item.icon className="size-5" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </div>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={item.href}>
                  <Button variant="ghost" className="w-full justify-start px-0">
                    Explorează →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
