import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "mipe" },
    update: {
      name: "Ministerul Investițiilor și Proiectelor Europene",
      shortName: "MIPE",
      type: "minister",
      website: "https://mfe.gov.ro",
      published: true,
    },
    create: {
      slug: "mipe",
      name: "Ministerul Investițiilor și Proiectelor Europene",
      shortName: "MIPE",
      type: "minister",
      website: "https://mfe.gov.ro",
      published: true,
    },
  });

  const ds = await prisma.dataSource.upsert({
    where: { slug: "pnrr-plati" },
    update: {
      name: "PNRR – Plăți",
      description: "Plăți PNRR publicate de MIPE (CSV)",
      organizationId: org.id,
      type: "csv",
      channel: "PUBLIC",
      active: true,
      published: true,
    },
    create: {
      slug: "pnrr-plati",
      name: "PNRR – Plăți",
      description: "Plăți PNRR publicate de MIPE (CSV)",
      organizationId: org.id,
      type: "csv",
      channel: "PUBLIC",
      active: true,
      published: true,
    },
  });

  console.log("Organization:", org.slug, org.id);
  console.log("DataSource:", ds.slug, ds.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
