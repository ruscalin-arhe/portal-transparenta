import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const proiecte = await prisma.proiect.findMany({
    select: { id: true, slug: true },
  });
  const bySlug = Object.fromEntries(proiecte.map((p) => [p.slug, p.id]));

  await prisma.document.deleteMany({});

  await prisma.document.createMany({
    data: [
      {
        titlu: "Raport progres – Sector Nord",
        tip: "PDF",
        data: "15.06.2026",
        dimensiune: "2.4 MB",
        url: "#",
        proiectId: bySlug["retea-electrica-nord"] ?? null,
      },
      {
        titlu: "Studiu fezabilitate – Sector Nord",
        tip: "PDF",
        data: "20.01.2026",
        dimensiune: "5.1 MB",
        url: "#",
        proiectId: bySlug["retea-electrica-nord"] ?? null,
      },
      {
        titlu: "Proces-verbal receptie DJ152",
        tip: "PDF",
        data: "20.12.2025",
        dimensiune: "1.1 MB",
        url: "#",
        proiectId: bySlug["reabilitare-dj152"] ?? null,
      },
      {
        titlu: "Buget detaliat proiecte 2026",
        tip: "XLSX",
        data: "01.03.2026",
        dimensiune: "890 KB",
        url: "#",
        proiectId: null,
      },
      {
        titlu: "Hotarare aprobare program investitii",
        tip: "PDF",
        data: "12.11.2025",
        dimensiune: "320 KB",
        url: "#",
        proiectId: null,
      },
    ],
  });

  console.log("Seed documente OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
