import Link from "next/link";

export const dynamic = "force-dynamic";

type TenderRow = {
  id: string;
  title: string;
  cpvMain: string | null;
  cpvCodes?: string[];
  valueEstimated: number | null;
  valueCurrency: string | null;
  contractingAuthority: string | null;
  status: string | null;
  publicationDate: string | Date | null;
  procedureType?: string | null;
  externalId?: string | null;
};

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("ro-RO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(v: number | null | undefined, currency?: string | null) {
  if (v == null || Number.isNaN(v)) return "—";
  return (
    v.toLocaleString("ro-RO", { maximumFractionDigits: 0 }) +
    " " +
    (currency || "RON")
  );
}

async function getTenders(opts: {
  q?: string;
  cpv?: string;
  page: number;
  take: number;
}) {
  const { prisma } = await import("@/lib/prisma");
  const where: Record<string, unknown> = { published: true };

  if (opts.cpv) {
    where.OR = [
      { cpvMain: { contains: opts.cpv, mode: "insensitive" } },
      { cpvCodes: { has: opts.cpv } },
    ];
  }
  if (opts.q) {
    where.AND = [
      {
        OR: [
          { title: { contains: opts.q, mode: "insensitive" } },
          { contractingAuthority: { contains: opts.q, mode: "insensitive" } },
          { externalId: { contains: opts.q, mode: "insensitive" } },
        ],
      },
    ];
  }

  const skip = (opts.page - 1) * opts.take;
  const [data, total] = await Promise.all([
    prisma.tender.findMany({
      where,
      orderBy: { publicationDate: "desc" },
      take: opts.take,
      skip,
      select: {
        id: true,
        title: true,
        cpvMain: true,
        cpvCodes: true,
        valueEstimated: true,
        valueCurrency: true,
        contractingAuthority: true,
        status: true,
        publicationDate: true,
        procedureType: true,
        externalId: true,
      },
    }),
    prisma.tender.count({ where }),
  ]);
  return { total, data, page: opts.page, take: opts.take };
}

export default async function AchizitiiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cpv = typeof sp.cpv === "string" ? sp.cpv.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const take = 30;

  const { total, data } = await getTenders({ q, cpv, page, take });
  const totalPages = Math.max(1, Math.ceil(total / take));

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cpv) params.set("cpv", cpv);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return s ? `/achizitii?${s}` : "/achizitii";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achiziții publice</h1>
        <p className="text-muted-foreground mt-2">
          Anunțuri SEAP / SICAP din surse deschise —{" "}
          {total.toLocaleString("ro-RO")} înregistrări publicate
        </p>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        method="get"
      >
        <div className="flex-1 space-y-1">
          <label htmlFor="q" className="text-sm font-medium">
            Căutare
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="titlu, autoritate, nr. anunț…"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full space-y-1 sm:w-40">
          <label htmlFor="cpv" className="text-sm font-medium">
            CPV
          </label>
          <input
            id="cpv"
            name="cpv"
            defaultValue={cpv}
            placeholder="ex. 4523"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
        >
          Filtrează
        </button>
      </form>

      <div className="space-y-4">
        {data.map((t: TenderRow) => (
          <article
            key={t.id}
            className="rounded-lg border p-4 shadow-sm transition hover:shadow-md"
          >
            <h2 className="leading-snug font-semibold">{t.title}</h2>
            <div className="text-muted-foreground mt-2 space-y-1 text-sm">
              <p>
                <span className="text-foreground/80">CPV:</span>{" "}
                {t.cpvMain ?? "—"}
                {t.valueEstimated != null && (
                  <>
                    {" · "}
                    <span className="text-foreground/80">Valoare:</span>{" "}
                    {formatMoney(t.valueEstimated, t.valueCurrency)}
                  </>
                )}
              </p>
              <p>
                <span className="text-foreground/80">Autoritate:</span>{" "}
                {t.contractingAuthority ?? "—"}
              </p>
              <p>
                {t.status ?? "—"}
                {t.procedureType ? ` · ${t.procedureType}` : ""}
                {" · "}
                {formatDate(t.publicationDate)}
                {t.externalId ? ` · ${t.externalId}` : ""}
              </p>
            </div>
          </article>
        ))}
        {data.length === 0 && (
          <p className="text-muted-foreground">
            Nicio achiziție pentru filtrele selectate.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            Pagina {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={hrefFor(page - 1)} className="underline">
                ← Anterior
              </Link>
            ) : (
              <span className="text-muted-foreground">← Anterior</span>
            )}
            {page < totalPages ? (
              <Link href={hrefFor(page + 1)} className="underline">
                Următor →
              </Link>
            ) : (
              <span className="text-muted-foreground">Următor →</span>
            )}
          </div>
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        <Link href="/" className="underline">
          ← Înapoi la portal
        </Link>
      </p>
    </div>
  );
}
