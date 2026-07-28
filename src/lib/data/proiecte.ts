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
      "Proiect de modernizare a rețelei electrice de medie tensiune în zona de nord a municipiului, incluzând înlocuirea cablurilor și modernizarea posturilor de transformare.",
    dataStart: "15.03.2025",
    dataEstimata: "30.11.2026",
    beneficiar: "Compania de Distribuție Energie",
    lat: 46.7712,
    lng: 23.6236,
  },
  {
    id: "2",
    nume: "Infrastructură digitală – Coridor Est",
    status: "Planificat",
    localitate: "Iași",
    valoare: "8.1 mil. RON",
    progres: 15,
    descriere:
      "Dezvoltarea infrastructurii de comunicații optice de-a lungul coridorului estic pentru susținerea serviciilor digitale publice.",
    dataStart: "01.09.2026",
    dataEstimata: "31.12.2027",
    beneficiar: "Autoritatea pentru Digitalizare",
    lat: 47.1585,
    lng: 27.6014,
  },
  {
    id: "3",
    nume: "Reabilitare drum județean DJ152",
    status: "Finalizat",
    localitate: "Târgu Mureș",
    valoare: "5.7 mil. RON",
    progres: 100,
    descriere:
      "Reabilitare completă a drumului județean DJ152 pe o lungime de 18 km, inclusiv semnalizare și elemente de siguranță.",
    dataStart: "10.04.2024",
    dataEstimata: "20.12.2025",
    beneficiar: "Consiliul Județean",
    lat: 46.5427,
    lng: 24.5575,
  },
];

export function getProiectById(id: string) {
  return proiecte.find((p) => p.id === id);
}
