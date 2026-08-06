import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const rows = await p.pnrrPlata.findMany({
    where: { dataRunId: "cmshn7lnx00011sb7ovlwf0fg" },
    take: 5,
    select: {
      beneficiar: true,
      suma: true,
      investitie: true,
      judet: true,
      componenta: true,
      dataStatus: true,
    },
  });
  const counts = await p.pnrrPlata.groupBy({
    by: ["dataStatus"],
    where: { dataRunId: "cmshn7lnx00011sb7ovlwf0fg" },
    _count: true,
  });
  console.log("STATUS", counts);
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => p.$disconnect());
