import { PrismaClient } from "@prisma/client";
import { validatePnrrPlata } from "../src/lib/data-quality/pnrr-validate";

const p = new PrismaClient();
const RUN = "cmshn7lnx00011sb7ovlwf0fg";

async function main() {
  const r = await p.pnrrPlata.updateMany({
    where: {
      dataRunId: RUN,
      OR: [{ investitie: null }, { investitie: "" }],
    },
    data: { investitie: "PNRR" },
  });
  console.log("filled investitie = PNRR:", r.count);

  const rows = await p.pnrrPlata.findMany({ where: { dataRunId: RUN } });
  let upd = 0;
  for (const row of rows) {
    const v = validatePnrrPlata({
      componenta: row.componenta,
      investitie: row.investitie,
      beneficiar: row.beneficiar,
      suma: row.suma,
      moneda: row.moneda,
      dataPlata: row.dataPlata,
      judet: row.judet,
    });
    if (
      v.dataStatus !== row.dataStatus ||
      v.completenessScore !== row.completenessScore
    ) {
      await p.pnrrPlata.update({
        where: { id: row.id },
        data: {
          dataStatus: v.dataStatus,
          completenessScore: v.completenessScore,
          published: v.dataStatus !== "MISSING_DATA",
        },
      });
      upd++;
    }
  }
  console.log("revalidated", upd);

  const counts = await p.pnrrPlata.groupBy({
    by: ["dataStatus"],
    where: { dataRunId: RUN },
    _count: true,
  });
  console.log("STATUS", counts);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
