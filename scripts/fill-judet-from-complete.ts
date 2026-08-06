import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  // 1. Mapă beneficiar → judet din rânduri care AU judet
  const withJudet = await prisma.pnrrPlata.findMany({
    where: { judet: { not: null } },
    select: { beneficiar: true, judet: true },
  });

  const map = new Map<string, string>();
  for (const r of withJudet) {
    if (!r.beneficiar || !r.judet) continue;
    const key = norm(r.beneficiar);
    // preferă prima valoare stabilă
    if (!map.has(key)) map.set(key, r.judet);
  }
  console.log("Beneficiari cu judet cunoscut:", map.size);

  // 2. Rânduri fără judet
  const missing = await prisma.pnrrPlata.findMany({
    where: {
      OR: [{ judet: null }, { judet: "" }],
      beneficiar: { not: null },
    },
    select: { id: true, beneficiar: true },
  });
  console.log("Rânduri fără judet:", missing.length);

  let updated = 0;
  for (const r of missing) {
    if (!r.beneficiar) continue;
    const j = map.get(norm(r.beneficiar));
    if (!j) continue;
    await prisma.pnrrPlata.update({
      where: { id: r.id },
      data: { judet: j },
    });
    updated++;
    if (updated % 100 === 0) console.log("updated", updated);
  }

  console.log("Done. Completate:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
