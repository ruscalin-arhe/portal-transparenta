import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const row = await p.dataSource.upsert({
    where: { slug: "pndl-plati" },
    create: {
      slug: "pndl-plati",
      name: "PNDL – Plăți",
      sourceUrl: "https://data.gov.ro/dataset?q=pndl&res_format=XLS",
    },
    update: {
      name: "PNDL – Plăți",
      sourceUrl: "https://data.gov.ro/dataset?q=pndl&res_format=XLS",
    },
  });
  console.log("CREATED/UPDATED", row);
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
