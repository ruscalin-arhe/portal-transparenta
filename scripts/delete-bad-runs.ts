import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const bad = await p.dataRun.findMany({
    where: {
      OR: [{ recordsOk: 0 }, { recordsOk: null }],
      recordsTotal: { gt: 100 },
    },
    select: { id: true, recordsTotal: true, recordsOk: true },
  });
  console.log("Bad runs:", bad);
  for (const r of bad) {
    const del = await p.pnrrPlata.deleteMany({ where: { dataRunId: r.id } });
    await p.dataRun.delete({ where: { id: r.id } });
    console.log("deleted", r.id, "plati", del.count);
  }
}
main().finally(() => p.$disconnect());
