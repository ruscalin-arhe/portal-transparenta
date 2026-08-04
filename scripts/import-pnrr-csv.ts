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
  const headers = lines[0].split(sep).map((h) =>
    h
      .trim()
      .replace(/^"+|"+$/g, "")
      .replace(/^'+|'+$/g, "")
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
        if (!h) return;
        row[h] = (cols[i] || "").trim().replace(/^"+|"+$/g, "");
      });
      return row;
    });
}

function normalizeKey(h: string): string {
  return h
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .trim()
    .toLowerCase();
}

function normalizeRow(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeKey(k);
    if (!nk) continue;
    out[nk] = String(v ?? "")
      .trim()
      .replace(/^"+|"+$/g, "");
  }
  return out;
}

function pick(row: Record<string, string>, keys: string[]) {
  const entries = Object.entries(row);
  for (const k of keys) {
    const found = entries.find(([h]) => h.includes(k));
    if (found && found[1]) return found[1];
  }
  return null;
}

function excelSerialToDate(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(t)) return t;
  if (/^\d{1,2}[-./]\d{1,2}[-./]\d{2,4}/.test(t)) return t;
  const n = parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 20000 || n > 60000) return t;
  const epoch = Date.UTC(1899, 11, 30);
  const d = new Date(epoch + Math.round(n) * 86400000);
  if (Number.isNaN(d.getTime())) return t;
  return d.toISOString().slice(0, 10);
}

const JUDETE = [
  "Alba",
  "Arad",
  "Argeș",
  "Arges",
  "Bacău",
  "Bacau",
  "Bihor",
  "Bistrița",
  "Bistrita",
  "Botoșani",
  "Botosani",
  "Brăila",
  "Braila",
  "Brașov",
  "Brasov",
  "București",
  "Bucuresti",
  "Buzău",
  "Buzau",
  "Călărași",
  "Calarasi",
  "Caraș",
  "Caras",
  "Cluj",
  "Constanța",
  "Constanta",
  "Covasna",
  "Dâmbovița",
  "Dambovita",
  "Dolj",
  "Galați",
  "Galati",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Ialomita",
  "Iași",
  "Iasi",
  "Ilfov",
  "Maramureș",
  "Maramures",
  "Mehedinți",
  "Mehedinti",
  "Mureș",
  "Mures",
  "Neamț",
  "Neamt",
  "Olt",
  "Prahova",
  "Sălaj",
  "Salaj",
  "Satu Mare",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Timis",
  "Tulcea",
  "Vâlcea",
  "Valcea",
  "Vaslui",
  "Vrancea",
];

function extractJudet(text: string | null): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const j of JUDETE) {
    if (upper.includes(j.toUpperCase())) return j;
  }
  const m = text.match(/OUG\s*124\/2021\s+([A-Za-zăâîșțĂÂÎȘȚ\-]+)/i);
  return m ? m[1].trim() : null;
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
      const r = normalizeRow(row);

      const sumaRaw = pick(r, ["suma", "valoare", "plata", "amount"]);
      let suma: number | null = null;
      if (sumaRaw) {
        const n = parseFloat(
          sumaRaw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
        );
        suma = Number.isFinite(n) ? n : null;
      }

      const explicatii = pick(r, [
        "explicat",
        "explicatii",
        "observat",
        "detalii",
      ]);
      const dataRaw = pick(r, [
        "data",
        "date",
        "luna",
        "data plata",
        "dataplata",
      ]);
      const beneficiar = pick(r, [
        "beneficiar",
        "primarie",
        "uats",
        "solicitant",
      ]);

      const draft = {
        componenta: pick(r, ["component", "comp"]) || "PNRR",
        investitie:
          pick(r, ["invest", "masura", "titlu", "proiect", "denumire"]) ||
          explicatii,
        beneficiar,
        suma,
        moneda: pick(r, ["moneda", "currency"]) || "RON",
        dataPlata: excelSerialToDate(dataRaw),
        judet:
          pick(r, ["judet", "județ", "county"]) ||
          extractJudet(explicatii) ||
          extractJudet(beneficiar),
        sourceUrl,
      };

      const v = validatePnrrPlata(draft);
      if (v.dataStatus === "MISSING_DATA") recordsError += 1;

      payload.push({
        ...draft,
        sourceFile: file,
        rawJson: JSON.stringify(r),
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
