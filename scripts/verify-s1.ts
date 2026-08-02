import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();
  const org = await p.organization.findUnique({ where: { slug: "mipe" } });
  const ds = await p.dataSource.findUnique({ where: { slug: "pnrr-plati" } });
  const runs = await p.dataRun.count();
  const withRun = await p.pnrrPlata.count({
    where: { dataRunId: { not: null } },
  });
  console.log({
    org: org?.slug ?? null,
    ds: ds?.slug ?? null,
    runs,
    pnrrWithDataRunId: withRun,
  });
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
