import { PrismaClient } from "@prisma/client";

const DAYS = Number(process.env.PAGEVIEW_RETENTION_DAYS || "90");
const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (Number.isFinite(DAYS) ? DAYS : 90));

  const result = await prisma.pageView.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(
    JSON.stringify({
      ok: true,
      retentionDays: DAYS,
      cutoff: cutoff.toISOString(),
      deleted: result.count,
    })
  );
}

main()
  .catch((e) => {
    console.error("FATAL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
