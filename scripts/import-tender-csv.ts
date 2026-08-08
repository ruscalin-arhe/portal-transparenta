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
  const s = raw.trim();
  // Already a Date string from XLSX cellDates
  const asDate = new Date(s);
  if (
    !Number.isNaN(asDate.getTime()) &&
    /[a-zA-Z-]/.test(s) &&
    !/^\d+(\.\d+)?$/.test(s)
  ) {
    return asDate;
  }
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // DD.MM.YYYY or DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  // Excel serial (days since 1899-12-30)
  const serial = parseFloat(s.replace(",", "."));
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const utc = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000;
    // fraction = time of day
    const frac = serial - Math.floor(serial);
    return new Date(utc + Math.round(frac * 86400000));
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
        const key = String(k).trim().toLowerCase().replace(/\s+/g, " ");
        let val = v == null ? "" : String(v).trim();
        // Excel serial date leftover as number string
        out[key] = val;
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
    // Mapare SEAP (headers lowercased + trimmed)
    const title =
      pick(row, [
        "denumire procedura",
        "denumire cpv",
        "title",
        "titlu",
        "denumire",
        "obiect",
        "name",
      ]) || "";
    if (!title) {
      recordsError += 1;
      continue;
    }

    const cpvRaw = pick(row, [
      "cod cpv",
      "cpv",
      "cpv_main",
      "cod_cpv",
      "cpv_code",
    ]);
    const cpvCodes = cpvRaw
      ? cpvRaw
          .split(/[;,|]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    // CPV SEAP: "34632300-9" → main fără sufix opțional
    const cpvMain = cpvCodes[0] ? cpvCodes[0].split("-")[0] : null;

    const valueEstimated = parseNumber(
      pick(row, [
        "valoare estimata procedura (ron)",
        "valoare estimata",
        "value",
        "valoare",
        "amount",
      ])
    );

    const publicationDate = parseDate(
      pick(row, [
        "data publicare",
        "publication_date",
        "data_publicare",
        "data",
      ])
    );

    payload.push({
      externalId:
        pick(row, [
          "numar anunt initiere",
          "numar anunt",
          "external_id",
          "nr_anunt",
          "id",
        ]) || null,
      title,
      cpvCodes,
      cpvMain,
      valueEstimated,
      valueCurrency:
        pick(row, ["moneda", "currency", "valuecurrency"]) || "RON",
      contractingAuthority:
        pick(row, [
          "autoritate contractanta",
          "authority",
          "autoritate",
          "beneficiar",
        ]) || null,
      status:
        pick(row, ["stare procedura", "status", "stare", "stare_anunt"]) ||
        null,
      publicationDate,
      deadline: parseDate(
        pick(row, ["deadline", "data_limita", "data limita"])
      ),
      procedureType:
        pick(row, [
          "tip procedura",
          "procedure",
          "tip_procedura",
          "procedure_type",
        ]) || null,
      sourceUrl,
      sourceFile: file,
      rawJson: JSON.stringify(row),
      published: true,
      dataRunId: run.id,
    });
  }

  let inserted = 0;
  let updated = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const chunk = payload.slice(i, i + CHUNK);
    for (const row of chunk) {
      if (row.externalId) {
        const existing = await prisma.tender.findFirst({
          where: { externalId: row.externalId },
          select: { id: true },
        });
        if (existing) {
          await prisma.tender.update({
            where: { id: existing.id },
            data: {
              title: row.title,
              cpvCodes: row.cpvCodes,
              cpvMain: row.cpvMain,
              valueEstimated: row.valueEstimated,
              valueCurrency: row.valueCurrency,
              contractingAuthority: row.contractingAuthority,
              status: row.status,
              publicationDate: row.publicationDate,
              deadline: row.deadline,
              procedureType: row.procedureType,
              sourceUrl: row.sourceUrl,
              sourceFile: row.sourceFile,
              rawJson: row.rawJson,
              published: row.published,
              dataRunId: row.dataRunId,
            },
          });
          updated += 1;
        } else {
          await prisma.tender.create({ data: row });
          inserted += 1;
        }
      } else {
        await prisma.tender.create({ data: row });
        inserted += 1;
      }
    }
    console.log(
      "[batch]",
      i + chunk.length + "/" + payload.length,
      "(new:",
      inserted,
      "upd:",
      updated + ")"
    );
  }

  const recordsOk = inserted + updated;
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
