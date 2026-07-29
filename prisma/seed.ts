import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const proiecte = [
  {
    slug: "retea-electrica-nord",
    nume: "Modernizare rețea electrică – Sector Nord",
    status: "În derulare",
    localitate: "Cluj-Napoca",
    valoareText: "12.4 mil. RON",
    valoareMil: 12.4,
    progres: 67,
    descriere:
      "Proiect de modernizare a rețelei electrice de medie tensiune, cu înlocuirea cablurilor și modernizarea posturilor de transformare.",
    dataStart: "15.03.2025",
    dataEstimata: "30.11.2026",
    beneficiar: "Operator de distribuție energie",
    categorie: "Infrastructură energetică",
    lat: 46.7712,
    lng: 23.6236,
  },
  {
    slug: "infrastructura-digitala-est",
    nume: "Infrastructură digitală – Regiunea Est",
    status: "Planificat",
    localitate: "Iași",
    valoareText: "8.1 mil. RON",
    valoareMil: 8.1,
    progres: 15,
    descriere:
      "Dezvoltarea infrastructurii de comunicații pentru servicii digitale publice.",
    dataStart: "01.09.2026",
    dataEstimata: "31.12.2027",
    beneficiar: "Autoritate publică pentru digitalizare",
    categorie: "Digitalizare",
    lat: 47.1585,
    lng: 27.6014,
  },
  {
    slug: "reabilitare-dj152",
    nume: "Reabilitare drum județean DJ152",
    status: "Finalizat",
    localitate: "Târgu Mureș",
    valoareText: "5.7 mil. RON",
    valoareMil: 5.7,
    progres: 100,
    descriere:
      "Reabilitare completă a drumului județean pe aproximativ 18 km, inclusiv semnalizare și elemente de siguranță.",
    dataStart: "10.04.2024",
    dataEstimata: "20.12.2025",
    beneficiar: "Consiliul Județean",
    categorie: "Transport",
    lat: 46.5427,
    lng: 24.5575,
  },
];

async function main() {
  for (const p of proiecte) {
    await prisma.proiect.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log("Seed OK:", proiecte.length, "proiecte");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
