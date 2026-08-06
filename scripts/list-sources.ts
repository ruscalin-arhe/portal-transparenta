import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const rows = await p.dataSource.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      sourceUrl: true,
      lastRunAt: true,
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}
main().finally(() => p.$disconnect());
