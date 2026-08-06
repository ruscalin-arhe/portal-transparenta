import { PrismaClient } from "@prisma/client";
import { validatePnrrPlata } from "../src/lib/data-quality/pnrr-validate";

const prisma = new PrismaClient();
const BATCH = 200;

async function main() {
  let skip = 0;
  let updated = 0;
  for (;;) {
    const rows = await prisma.pnrrPlata.findMany({
      take: BATCH,
      skip,
      select: {
        id: true,
        componenta: true,
        investitie: true,
        beneficiar: true,
        suma: true,
        moneda: true,
        dataPlata: true,
        judet: true,
        dataStatus: true,
        completenessScore: true,
        published: true,
      },
    });
    if (rows.length === 0) break;

    for (const r of rows) {
      const v = validatePnrrPlata({
        componenta: r.componenta,
        investitie: r.investitie,
        beneficiar: r.beneficiar,
        suma: r.suma,
        moneda: r.moneda,
        dataPlata: r.dataPlata,
        judet: r.judet,
      });
      if (
        v.dataStatus !== r.dataStatus ||
        v.completenessScore !== r.completenessScore
      ) {
        await prisma.pnrrPlata.update({
          where: { id: r.id },
          data: {
            dataStatus: v.dataStatus,
            completenessScore: v.completenessScore,
            validationReport: v.reportJson,
            published: v.dataStatus !== "MISSING_DATA",
          },
        });
        updated++;
      }
    }
    skip += rows.length;
    console.log("scanned", skip, "updated", updated);
  }
  console.log("Done. updated=", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
