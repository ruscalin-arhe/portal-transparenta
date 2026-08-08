import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const org = await p.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) throw new Error("Nicio Organization");

  const row = await p.dataSource.upsert({
    where: { slug: "pndl-plati" },
    create: {
      slug: "pndl-plati",
      name: "PNDL – Plăți",
      sourceUrl: "https://data.gov.ro/dataset?q=pndl&res_format=XLS",
      type: "CSV",
      channel: "PUBLIC",
      frequency: "as-needed",
      active: true,
      published: true,
      organizationId: org.id,
    },
    update: {
      name: "PNDL – Plăți",
      sourceUrl: "https://data.gov.ro/dataset?q=pndl&res_format=XLS",
    },
  });
  console.log("OK:", row.slug, row.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
