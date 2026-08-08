import Link from "next/link";

export const dynamic = "force-dynamic";

/** Pagina de explorare CPV — fundament pentru alerte Pro */
export default async function CpvExplorerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cpv = typeof sp.cpv === "string" ? sp.cpv.trim() : "";

  const { prisma } = await import("@/lib/prisma");
  let matches: {
    id: string;
    title: string;
    cpvMain: string | null;
    valueEstimated: number | null;
    contractingAuthority: string | null;
    publicationDate: Date | null;
  }[] = [];
  let total = 0;

  if (cpv.length >= 2) {
    const where = {
      published: true,
      OR: [{ cpvMain: { startsWith: cpv } }, { cpvCodes: { hasSome: [cpv] } }],
    };
    [matches, total] = await Promise.all([
      prisma.tender.findMany({
        where,
        orderBy: { publicationDate: "desc" },
        take: 40,
        select: {
          id: true,
          title: true,
          cpvMain: true,
          valueEstimated: true,
          contractingAuthority: true,
          publicationDate: true,
        },
      }),
      prisma.tender.count({ where }),
    ]);
  }

  // Top CPV-uri frecvente (agregare simplă)
  const top = await prisma.tender.groupBy({
    by: ["cpvMain"],
    where: { published: true, cpvMain: { not: null } },
    _count: true,
    orderBy: { _count: { cpvMain: "desc" } },
    take: 15,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explorator CPV</h1>
        <p className="text-muted-foreground mt-2">
          Matching pe coduri CPV — baza pentru alerte Pro
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="cpv"
          defaultValue={cpv}
          placeholder="ex. 4523 sau 3314"
          className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Caută CPV
        </button>
      </form>

      {cpv && (
        <p className="text-sm">
          {total.toLocaleString("ro-RO")} anunțuri pentru prefixul{" "}
          <strong>{cpv}</strong>
        </p>
      )}

      <div className="space-y-3">
        {matches.map((t) => (
          <article key={t.id} className="rounded-lg border p-3 text-sm">
            <p className="font-medium">{t.title}</p>
            <p className="text-muted-foreground mt-1">
              CPV {t.cpvMain ?? "—"}
              {t.valueEstimated != null &&
                ` · ${t.valueEstimated.toLocaleString("ro-RO")} RON`}
              {t.contractingAuthority && ` · ${t.contractingAuthority}`}
            </p>
          </article>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">CPV frecvente</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {top.map((t) =>
            t.cpvMain ? (
              <li key={t.cpvMain}>
                <Link
                  href={`/achizitii/cpv?cpv=${encodeURIComponent(t.cpvMain)}`}
                  className="bg-muted hover:bg-muted/80 rounded-full px-3 py-1"
                >
                  {t.cpvMain}{" "}
                  <span className="text-muted-foreground">({t._count})</span>
                </Link>
              </li>
            ) : null
          )}
        </ul>
      </div>

      <p className="text-muted-foreground text-sm">
        <Link href="/achizitii" className="underline">
          ← Toate achizițiile
        </Link>
      </p>
    </div>
  );
}
