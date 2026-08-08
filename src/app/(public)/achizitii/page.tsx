import Link from "next/link";

export const dynamic = "force-dynamic";

async function getTenders() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/achizitii?take=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { total: 0, data: [] };
    return res.json();
  } catch {
    return { total: 0, data: [] };
  }
}

export default async function AchizitiiPage() {
  const { total, data } = await getTenders();

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achiziții publice</h1>
        <p className="text-muted-foreground mt-2">
          Anunțuri și contracte din SEAP / SICAP ({total} înregistrări)
        </p>
      </div>

      <div className="space-y-4">
        {data.map(
          (t: {
            id: string;
            title: string;
            cpvMain: string | null;
            valueEstimated: number | null;
            valueCurrency: string | null;
            contractingAuthority: string | null;
            status: string | null;
            publicationDate: string | null;
          }) => (
            <article
              key={t.id}
              className="rounded-lg border p-4 shadow-sm transition hover:shadow-md"
            >
              <h2 className="leading-snug font-semibold">{t.title}</h2>
              <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                <p>
                  CPV: {t.cpvMain ?? "—"}
                  {t.valueEstimated != null &&
                    ` · ${t.valueEstimated.toLocaleString("ro-RO")} ${
                      t.valueCurrency || "RON"
                    }`}
                </p>
                <p>Autoritate: {t.contractingAuthority ?? "—"}</p>
                <p>
                  {t.status ?? "—"}
                  {t.publicationDate &&
                    ` · ${new Date(t.publicationDate).toLocaleDateString(
                      "ro-RO"
                    )}`}
                </p>
              </div>
            </article>
          )
        )}
        {data.length === 0 && (
          <p className="text-muted-foreground">
            Nicio achiziție publicată încă.
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        <Link href="/" className="underline">
          ← Înapoi la portal
        </Link>
      </p>
    </div>
  );
}
