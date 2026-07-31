import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const file = process.argv[2];
const sourceUrl = process.argv[3] || "local-csv";

if (!file) {
  console.error(
    'Usage: pnpm exec tsx scripts/import-pnrr-csv.ts <file.csv> [sourceUrl]'
  );
  process.exit(1);
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  return lines.slice(1).filter(Boolean).map((line) => {
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
  const text = readFileSync(file, "utf8");
  const rows = parseCsv(text);
  let n = 0;

  for (const row of rows) {
    const sumaRaw = pick(row, ["suma", "valoare", "plata", "amount"]);
    const suma = sumaRaw
      ? parseFloat(
          sumaRaw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
        )
      : null;

    await prisma.pnrrPlata.create({
      data: {
        componenta: pick(row, ["component", "comp"]),
        investitie: pick(row, ["invest", "masura", "titlu", "proiect", "denumire"]),
        beneficiar: pick(row, ["beneficiar", "primarie", "uats", "solicitant"]),
        suma: Number.isFinite(suma as number) ? (suma as number) : null,
        moneda: pick(row, ["moneda", "currency"]) || "RON",
        dataPlata: pick(row, ["data", "date", "luna"]),
        judet: pick(row, ["judet", "județ", "county"]),
        rawJson: JSON.stringify(row),
        sourceUrl,
        sourceFile: file,
      },
    });
    n++;
  }

  console.log("Import PnrrPlata:", n, "randuri din", file);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
