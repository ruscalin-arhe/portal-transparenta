import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { PrismaClient, Prisma } from "@prisma/client";
import { validatePnrrPlata } from "../src/lib/data-quality/pnrr-validate";
import { withRetry } from "../src/lib/db/retry";

const prisma = new PrismaClient();
const CHUNK = 50;
const DS_SLUG = "pnrr-plati";

function fail(msg: string, code = 1): never {
  console.error("ERROR:", msg);
  process.exit(code);
}

/** Args: <file.csv> [sourceUrl] [--force] */
const argv = process.argv.slice(2).filter((a) => a !== "--force");
const force = process.argv.includes("--force");
const file = argv[0];
const sourceUrl = argv[1] || "https://data.gov.ro";

if (!file) {
  fail(
    "Usage: pnpm exec tsx scripts/import-pnrr-csv.ts <file.csv> [sourceUrl] [--force]"
  );
}
if (!existsSync(file)) fail("File not found: " + file);
if (!process.env.DATABASE_URL) fail("DATABASE_URL missing");

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV has no data rows");
  const sep = lines[0].includes(";") ? ";" : ",";
  const rawHeaders = lines[0].split(sep).map((h) => h.trim());
  const headers = rawHeaders.map((h) =>
    h
      .replace(/^"+|"+$/g, "")
      .trim()
      .toLowerCase()
  );
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
    const found = Object.keys(row).find((h) => h.toLowerCase().includes(k));
    if (found && row[found]) return row[found];
  }
  return null;
}

function extractJudet(explicatii: string | null): string | null {
  if (!explicatii) return null;
  // Ex: "TRANSFERURI PNRR CF. OUG 124/2021 Alba"
  const m = explicatii.match(/OUG\s*124\/2021\s+([A-Za-zăâîșțĂÂÎȘȚ\-\s]+)/i);
  if (m) return m[1].trim();
  // fallback: ultimele cuvinte
  const parts = explicatii.trim().split(/\s+/);
  return parts.length > 2 ? parts.slice(-2).join(" ") : null;
}

function fileHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function metaFileHash(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  return typeof m.fileHash === "string" ? m.fileHash : null;
}

async function main() {
  await withRetry(() => prisma.$connect(), { label: "connect" });

  const dataSource = await prisma.dataSource.findUnique({
    where: { slug: DS_SLUG },
  });
  if (!dataSource) {
    fail(
      'DataSource "' +
        DS_SLUG +
        '" negasit. Ruleaza: pnpm exec tsx prisma/seed-registry.ts'
    );
  }

  const rawText = readFileSync(file, "utf8");
  const hash = fileHash(rawText);
  console.log("fileHash:", hash.slice(0, 12) + "...");

  if (!force) {
    const recent = await prisma.dataRun.findMany({
      where: { dataSourceId: dataSource.id, status: "ok" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const dup = recent.find((r) => metaFileHash(r.metadata) === hash);
    if (dup) {
      console.log(
        "SKIP: deja importat (DataRun " +
          dup.id +
          "). Foloseste --force pentru reimport."
      );
      return;
    }
  } else {
    console.log("FORCE: reimport chiar daca hash-ul exista");
  }

  const rows = parseCsv(rawText);
  console.log(
    "Rows:",
    rows.length,
    "| source:",
    sourceUrl,
    "| ds:",
    dataSource.slug
  );
  if (rows.length > 0) {
    console.log("HEADERS:", Object.keys(rows[0]));
    console.log("FIRST ROW:", JSON.stringify(rows[0]).slice(0, 300));
  }

  const run = await prisma.dataRun.create({
    data: {
      dataSourceId: dataSource.id,
      status: "running",
      startedAt: new Date(),
      sourceFile: file,
      sourceUrl,
      recordsTotal: rows.length,
      metadata: {
        fileHash: hash,
        force,
      } as Prisma.InputJsonValue,
    },
  });
  console.log("DataRun:", run.id);

  type PayloadRow = {
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
  };

  const payload: PayloadRow[] = [];
  let recordsError = 0;

  try {
    for (const row of rows) {
      const sumaRaw = pick(row, ["suma", "valoare", "plata", "amount"]);
      let suma: number | null = null;
      if (sumaRaw) {
        const n = parseFloat(
          sumaRaw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
        );
        suma = Number.isFinite(n) ? n : null;
      }

      const explicatii = pick(row, [
        "explicat",
        "explicatii",
        "observat",
        "detalii",
      ]);
      const draft = {
        componenta: pick(row, ["component", "comp"]),
        investitie:
          pick(row, ["invest", "masura", "titlu", "proiect", "denumire"]) ||
          explicatii,
        beneficiar: pick(row, ["beneficiar", "primarie", "uats", "solicitant"]),
        suma,
        moneda: pick(row, ["moneda", "currency"]) || "RON",
        dataPlata: pick(row, ["data", "date", "luna"]),
        judet:
          pick(row, ["judet", "județ", "county"]) || extractJudet(explicatii),
        sourceUrl,
      };

      const v = validatePnrrPlata(draft);
      if (v.dataStatus === "MISSING_DATA") recordsError += 1;

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
        { label: "batch " + (Math.floor(i / CHUNK) + 1) }
      );
      inserted += chunk.length;
      console.log("[batch]", inserted + "/" + payload.length);
    }

    const recordsOk = inserted - recordsError;

    await prisma.dataRun.update({
      where: { id: run.id },
      data: {
        status: "ok",
        finishedAt: new Date(),
        recordsTotal: inserted,
        recordsOk,
        recordsError,
      },
    });

    await prisma.dataSource.update({
      where: { id: dataSource.id },
      data: { lastRunAt: new Date() },
    });

    console.log(
      "Done. inserted=" +
        inserted +
        " ok~=" +
        recordsOk +
        " missing~=" +
        recordsError +
        " run=" +
        run.id
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.dataRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        finishedAt: new Date(),
        errorLog: msg.slice(0, 4000),
        recordsTotal: rows.length,
        recordsError: rows.length,
      },
    });
    throw e;
  }
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
