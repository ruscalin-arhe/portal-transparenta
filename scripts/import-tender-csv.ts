/**
 * Import Tender (Achiziții / SICAP) din CSV.
 * Usage:
 *   pnpm exec tsx scripts/import-tender-csv.ts <file.csv> [sourceUrl] [--source=sicap-achizitii] [--force]
 *
 * CSV așteptat (coloane flexibile, case-insensitive):
 *   title / titlu / denumire
 *   cpv / cpv_main / cod_cpv
 *   value / valoare / valoare_estimata
 *   authority / autoritate / beneficiar
 *   status
 *   publication_date / data_publicare
 *   deadline / data_limita
 *   external_id / nr_anunt / id
 */
import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();
const CHUNK = 50;

const DS_SLUG =
  process.argv.find((a) => a.startsWith("--source="))?.split("=")[1] ||
  "sicap-achizitii";

const force = process.argv.includes("--force");
const argv = process.argv
  .slice(2)
  .filter((a) => a !== "--force" && !a.startsWith("--source="));
const file = argv[0];
const sourceUrl = argv[1] || "https://data.gov.ro";

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

function fileHash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function metaFileHash(metadata: unknown): string | null {
  if (metadata && typeof metadata === "object" && "fileHash" in metadata) {
    return String((metadata as { fileHash: string }).fileHash);
  }
  return null;
}

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

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v) return v;
  }
  return "";
}

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/\s/g, "");
  // Dacă are și punct și virgulă → punct = mii, virgulă = zecimal
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  // altfel lasă punctul ca zecimal (format en)
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // ISO or DD.MM.YYYY or Excel serial
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return new Date(raw);
  const m = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const serial = parseFloat(raw);
  if (Number.isFinite(serial) && serial > 30000) {
    // Excel serial → JS date
    const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return d;
  }
  return null;
}

async function main() {
  if (!file) {
    fail(
      "Usage: pnpm exec tsx scripts/import-tender-csv.ts <file.csv> [sourceUrl] [--source=sicap-achizitii] [--force]"
    );
  }
  if (!existsSync(file)) fail("File not found: " + file);
  if (!process.env.DATABASE_URL) fail("DATABASE_URL missing");

  const dataSource = await prisma.dataSource.findUnique({
    where: { slug: DS_SLUG },
  });
  if (!dataSource) {
    fail(`DataSource "${DS_SLUG}" negasit. Creează-l din /admin/registry.`);
  }

  const isXlsx =
    file.toLowerCase().endsWith(".xlsx") || file.toLowerCase().endsWith(".xls");
  let rows: Record<string, string>[];
  let hashInput: string;

  if (isXlsx) {
    const buf = readFileSync(file);
    hashInput = createHash("sha256").update(buf).digest("hex");
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    rows = json.map((r) => {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) {
        const key = String(k).trim().toLowerCase();
        out[key] = v == null ? "" : String(v).trim();
      }
      return out;
    });
    console.log("XLSX sheet:", wb.SheetNames[0], "rows:", rows.length);
  } else {
    const rawText = readFileSync(file, "utf8");
    hashInput = fileHash(rawText);
    rows = parseCsv(rawText);
  }

  const hash = isXlsx ? hashInput : hashInput;
  console.log("fileHash:", hash.slice(0, 12) + "...");
  console.log("rows:", rows.length);

  const run = await prisma.dataRun.create({
    data: {
      dataSourceId: dataSource.id,
      status: "running",
      startedAt: new Date(),
      sourceFile: file,
      sourceUrl,
      recordsTotal: rows.length,
      metadata: { fileHash: hash, force } as Prisma.InputJsonValue,
    },
  });
  console.log("DataRun:", run.id);

  const payload = [];
  let recordsError = 0;

  for (const row of rows) {
    const title = pick(row, [
      "title",
      "titlu",
      "denumire",
      "denumire procedura",
      "denumire cpv",
      "obiect",
      "name",
      "denumireprocedura",
    ]);
    if (!title) {
      recordsError += 1;
      continue;
    }

    const cpvRaw = pick(row, [
      "cpv",
      "cpv_main",
      "cod_cpv",
      "cpv_code",
      "cpvcode",
    ]);
    const cpvCodes = cpvRaw
      ? cpvRaw
          .split(/[;,|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const cpvMain = cpvCodes[0] || null;

    const valueEstimated = parseNumber(
      pick(row, [
        "value",
        "valoare",
        "valoare_estimata",
        "valoareestimata",
        "amount",
      ])
    );

    payload.push({
      externalId:
        pick(row, [
          "external_id",
          "nr_anunt",
          "numar anunt initiere",
          "numar anunt",
          "id",
          "cod",
          "notice_id",
          "numaranuntinitiere",
        ]) || null,
      title,
      cpvCodes,
      cpvMain,
      valueEstimated,
      valueCurrency: pick(row, ["currency", "moneda"]) || "RON",
      contractingAuthority:
        pick(row, [
          "authority",
          "autoritate",
          "beneficiar",
          "contracting_authority",
          "autoritate_contractanta",
        ]) || null,
      status:
        pick(row, [
          "status",
          "stare",
          "stare procedura",
          "stare_anunt",
          "stareprocedura",
        ]) || null,
      publicationDate: parseDate(
        pick(row, [
          "publication_date",
          "data_publicare",
          "data",
          "published_at",
        ])
      ),
      deadline: parseDate(
        pick(row, ["deadline", "data_limita", "data_limita_depunere"])
      ),
      procedureType:
        pick(row, [
          "procedure",
          "tip_procedura",
          "tip procedura",
          "procedure_type",
          "tipprocedura",
        ]) || null,
      sourceUrl,
      sourceFile: file,
      rawJson: JSON.stringify(row),
      published: true, // pentru început publicăm tot ce are title
      dataRunId: run.id,
    });
  }

  let inserted = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const chunk = payload.slice(i, i + CHUNK);
    await prisma.tender.createMany({ data: chunk });
    inserted += chunk.length;
    console.log("[batch]", inserted + "/" + payload.length);
  }

  const recordsOk = inserted;
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

  console.log("DONE: inserted", recordsOk, "errors", recordsError);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
