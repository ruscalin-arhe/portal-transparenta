import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { validatePnrrPlata } from "../src/lib/data-quality/pnrr-validate";
import { withRetry } from "../src/lib/db/retry";

const prisma = new PrismaClient();
const file = process.argv[2];
const sourceUrl = process.argv[3] || "https://data.gov.ro";
const CHUNK = 50;
const DS_SLUG = "pnrr-plati";

function fail(msg: string, code = 1): never {
  console.error("ERROR:", msg);
  process.exit(code);
}

if (!file) {
  fail(
    "Usage: pnpm exec tsx scripts/import-pnrr-csv.ts <file.csv> [sourceUrl]"
  );
}
if (!existsSync(file)) fail(`File not found: ${file}`);
if (!process.env.DATABASE_URL) fail("DATABASE_URL missing");

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV has no data rows");
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(sep);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] || "").trim().replace(/^"|"$/g, "");
      });
      return row;
    });
}

function pick(row: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const found = Object.keys(row).find((h) => h.includes(k));
    if (found && row[found]) return row[found];
  }
  return null;
}

async function main() {
  await withRetry(() => prisma.$connect(), { label: "connect" });

  const dataSource = await prisma.dataSource.findUnique({
    where: { slug: DS_SLUG },
  });
  if (!dataSource) {
    fail(
      `DataSource "${DS_SLUG}" negasit. Ruleaza: pnpm exec tsx prisma/seed-registry.ts`
    );
  }

  const rows = parseCsv(readFileSync(file, "utf8"));
  console.log(
    `Rows: ${rows.length} | source: ${sourceUrl} | ds: ${dataSource.slug}`
  );

  const run = await prisma.dataRun.create({
    data: {
      dataSourceId: dataSource.id,
      status: "running",
      startedAt: new Date(),
      sourceFile: file,
      sourceUrl,
      recordsTotal: rows.length,
    },
  });
  console.log(`DataRun: ${run.id}`);

  const payload: {
    componenta: string | null;
    investitie: string | null;
    beneficiar: string | null;
    suma: number | null;
    moneda: string | null;
    dataPlata: string | null;
    judet: string | null;
    sourceUrl: string;
    sourceFile: string;
    rawJson: string;
    dataStatus: string;
    completenessScore: number;
    validationReport: string;
    published: boolean;
    dataRunId: string;
  }[] = [];

  for (const row of rows) {
    const sumaRaw = pick(row, ["suma", "valoare", "plata", "amount"]);
    let suma: number | null = null;
    if (sumaRaw) {
      const n = parseFloat(
        sumaRaw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
      );
      suma = Number.isFinite(n) ? n : null;
    }

    const draft = {
      componenta: pick(row, ["component", "comp"]),
      investitie: pick(row, [
        "invest",
        "masura",
        "titlu",
        "proiect",
        "denumire",
      ]),
      beneficiar: pick(row, ["beneficiar", "primarie", "uats", "solicitant"]),
      suma,
      moneda: pick(row, ["moneda", "currency"]) || "RON",
      dataPlata: pick(row, ["data", "date", "luna"]),
      judet: pick(row, ["judet", "județ", "county"]),
      sourceUrl,
    };

    const v = validatePnrrPlata(draft);
    payload.push({
      ...draft,
      sourceFile: file,
      rawJson: JSON.stringify(row),
      dataStatus: v.dataStatus,
      completenessScore: v.completenessScore,
      validationReport: v.reportJson,
      published: v.dataStatus !== "MISSING_DATA",
      dataRunId: run.id,
    });
  }

  let inserted = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const chunk = payload.slice(i, i + CHUNK);
    await withRetry(
      () =>
        prisma.$transaction(
          async (tx) => tx.pnrrPlata.createMany({ data: chunk }),
          { maxWait: 10_000, timeout: 30_000 }
        ),
      { label: `batch ${Math.floor(i / CHUNK) + 1}` }
    );
    inserted += chunk.length;
    console.log(`[batch] ${inserted}/${payload.length}`);
  }

  const recordsOk = inserted;
  await prisma.dataRun.update({
    where: { id: run.id },
    data: {
      status: "ok",
      finishedAt: new Date(),
      recordsTotal: inserted,
      recordsOk,
      recordsError: 0,
    },
  });
  await prisma.dataSource.update({
    where: { id: dataSource.id },
    data: { lastRunAt: new Date() },
  });
  console.log(`Done. inserted=${inserted} run=${run.id}`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
  });
