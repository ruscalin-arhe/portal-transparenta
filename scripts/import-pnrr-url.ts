/**
 * Descarca un CSV de la URL public si importa in PnrrPlata.
 * Usage:
 *   pnpm exec tsx scripts/import-pnrr-url.ts "https://.../file.csv" "https://data.gov.ro/dataset/..."
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const url = process.argv[2];
const sourceUrl = process.argv[3] || url;

if (!url) {
  console.error(
    "Usage: pnpm exec tsx scripts/import-pnrr-url.ts <csvUrl> [sourcePageUrl]"
  );
  process.exit(1);
}

async function main() {
  console.log("Fetching", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith("<!DOCTYPE") || text.includes("<html")) {
    throw new Error("URL returned HTML, not CSV");
  }

  mkdirSync("data", { recursive: true });
  const local = join("data", `pnrr-download-${Date.now()}.csv`);
  writeFileSync(local, text, "utf8");
  console.log("Saved", local, "bytes", text.length);

  // reuses existing importer
  const { spawnSync } = await import("child_process");
  const r = spawnSync(
    "pnpm",
    ["exec", "tsx", "scripts/import-pnrr-csv.ts", local, sourceUrl],
    { stdio: "inherit", shell: true }
  );
  process.exit(r.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
