import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

function pickExplicatii(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    const lk = k.toLowerCase().replace(/"/g, "");
    if (
      lk.includes("explicat") ||
      lk.includes("invest") ||
      lk.includes("detalii")
    ) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return null;
}

async function main() {
  const rows = await p.pnrrPlata.findMany({
    where: {
      OR: [{ investitie: null }, { investitie: "" }],
      rawJson: { not: null as any },
    },
    select: { id: true, rawJson: true },
    take: 50000,
  });
  console.log("de completat (max 50k):", rows.length);
  let n = 0;
  for (const r of rows) {
    const inv = pickExplicatii(r.rawJson);
    if (!inv) continue;
    await p.pnrrPlata.update({
      where: { id: r.id },
      data: { investitie: inv.slice(0, 500) },
    });
    n++;
    if (n % 200 === 0) console.log("updated", n);
  }
  console.log("Done. filled", n);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
