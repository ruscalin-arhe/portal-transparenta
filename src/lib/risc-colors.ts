export type NivelRisc = "scazut" | "mediu" | "ridicat" | "critic" | "nespecificat";

export const RISC_SCALE = [
  { key: "scazut" as const, label: "Scazut", hex: "#2E7D32", descriere: "Sub control; abateri minore" },
  { key: "mediu" as const, label: "Mediu", hex: "#F9A825", descriere: "Atentie; monitorizare sporita" },
  { key: "ridicat" as const, label: "Ridicat", hex: "#C62828", descriere: "Interventie prioritara" },
  { key: "critic" as const, label: "Critic", hex: "#B71C1C", descriere: "Impact major / blocaj" },
  { key: "nespecificat" as const, label: "Nespecificat", hex: "#546E7A", descriere: "Date incomplete" },
];

export function normalizeRisc(risc?: string | null): NivelRisc {
  if (!risc) return "nespecificat";
  const r = risc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (r.includes("critic")) return "critic";
  if (r.includes("ridicat") || r === "high") return "ridicat";
  if (r.includes("mediu") || r === "medium") return "mediu";
  if (r.includes("scazut") || r === "low") return "scazut";
  return "nespecificat";
}

export function riscColor(risc?: string | null): string {
  const key = normalizeRisc(risc);
  return RISC_SCALE.find((x) => x.key === key)?.hex ?? "#546E7A";
}
