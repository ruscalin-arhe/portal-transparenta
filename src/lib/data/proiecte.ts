export type Proiect = {
  id: string;
  nume: string;
  status: "În derulare" | "Planificat" | "Finalizat";
  localitate: string;
  valoare: string;
  progres: number;
  descriere: string;
  dataStart: string;
  dataEstimata: string;
  beneficiar: string;
  lat: number;
  lng: number;
  categorie?: string;
};

export const proiecte: Proiect[] = [
  {
    id: "1",
    nume: "Modernizare rețea electrică – Sector Nord",
    status: "În derulare",
    localitate: "Cluj-Napoca",
    valoare: "12.4 mil. RON",
    progres: 67,
    descriere:
      "Proiect de modernizare a rețelei electrice de medie tensiune, cu înlocuirea cablurilor și modernizarea posturilor de transformare. Informare publică conform obligațiilor de transparență.",
    dataStart: "15.03.2025",
    dataEstimata: "30.11.2026",
    beneficiar: "Operator de distribuție energie",
    lat: 46.7712,
    lng: 23.6236,
    categorie: "Infrastructură energetică",
  },
  {
    id: "2",
    nume: "Infrastructură digitală – Regiunea Est",
    status: "Planificat",
    localitate: "Iași",
    valoare: "8.1 mil. RON",
    progres: 15,
    descriere:
      "Dezvoltarea infrastructurii de comunicații pentru servicii digitale publice. Proiect cu finanțare publică, supus informării societății civile.",
    dataStart: "01.09.2026",
    dataEstimata: "31.12.2027",
    beneficiar: "Autoritate publică pentru digitalizare",
    lat: 47.1585,
    lng: 27.6014,
    categorie: "Digitalizare",
  },
  {
    id: "3",
    nume: "Reabilitare drum județean DJ152",
    status: "Finalizat",
    localitate: "Târgu Mureș",
    valoare: "5.7 mil. RON",
    progres: 100,
    descriere:
      "Reabilitare completă a drumului județean pe ~18 km, inclusiv semnalizare și elemente de siguranță rutieră.",
    dataStart: "10.04.2024",
    dataEstimata: "20.12.2025",
    beneficiar: "Consiliul Județean",
    lat: 46.5427,
    lng: 24.5575,
    categorie: "Transport",
  },
];

export function getProiectById(id: string) {
  return proiecte.find((p) => p.id === id);
}
