import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const byStatus = await p.pnrrPlata.groupBy({
    by: ["dataStatus"],
    _count: true,
  });
  const withJudet = await p.pnrrPlata.count({
    where: { judet: { not: null } },
  });
  const withInv = await p.pnrrPlata.count({
    where: { investitie: { not: null } },
  });
  const sample = await p.pnrrPlata.findMany({
    where: { judet: { not: null } },
    take: 15,
    select: {
      beneficiar: true,
      judet: true,
      investitie: true,
      componenta: true,
      dataStatus: true,
    },
    orderBy: { createdAt: "desc" },
  });
  console.log("STATUS", byStatus);
  console.log("cu judet", withJudet, "cu investitie", withInv);
  console.log("SAMPLE", JSON.stringify(sample, null, 2));
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
