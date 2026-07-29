export type DocumentPublic = {
  id: string;
  titlu: string;
  tip: string;
  data: string;
  dimensiune: string;
  url: string;
};

export const documente: DocumentPublic[] = [
  {
    id: "1",
    titlu: "Raport progres trimestrial – proiecte publice Q2 2026",
    tip: "PDF",
    data: "15.06.2026",
    dimensiune: "2.4 MB",
    url: "#",
  },
  {
    id: "2",
    titlu: "Buget detaliat proiecte de interes public 2026",
    tip: "XLSX",
    data: "01.03.2026",
    dimensiune: "890 KB",
    url: "#",
  },
  {
    id: "3",
    titlu: "Studiu de fezabilitate – Sector Nord",
    tip: "PDF",
    data: "20.01.2026",
    dimensiune: "5.1 MB",
    url: "#",
  },
  {
    id: "4",
    titlu: "Hotărâre de aprobare – program investiții publice",
    tip: "PDF",
    data: "12.11.2025",
    dimensiune: "320 KB",
    url: "#",
  },
];
