import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSesizariPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sesizari = await prisma.sesizare.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sesizari</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sesizari.length} inregistrari (acces restrictionat)
        </p>
      </div>

      <div className="grid gap-3">
        {sesizari.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between gap-4 flex-wrap">
                <CardTitle className="text-base">{s.subiect}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString("ro-RO")} · {s.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-muted-foreground whitespace-pre-wrap">{s.mesaj}</p>
              <p>
                <span className="font-medium">{s.nume}</span>
                {" · "}
                {s.email}
                {s.telefon ? ` · ${s.telefon}` : ""}
              </p>
            </CardContent>
          </Card>
        ))}
        {sesizari.length === 0 && (
          <p className="text-muted-foreground text-sm">Nicio sesizare.</p>
        )}
      </div>
    </div>
  );
}
