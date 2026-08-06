export type PnrrDraft = {
  componenta: string | null;
  investitie: string | null;
  beneficiar: string | null;
  suma: number | null;
  moneda?: string | null;
  dataPlata: string | null;
  judet: string | null;
  sourceUrl?: string;
};

export type PnrrValidation = {
  dataStatus: "MISSING_DATA" | "INSUFFICIENT_DATA" | "COMPLETE";
  completenessScore: number;
  reportJson: string;
  issues: string[];
};

/** Câmpuri esențiale pentru formatul oficial MDLPA (beneficiar+suma+dată). */
const CORE = ["beneficiar", "suma", "dataPlata"] as const;
/** Câmpuri care completează scorul (format bogat PNRR). */
const EXTRA = ["componenta", "investitie", "judet"] as const;

const JUDETE = [
  "Alba",
  "Arad",
  "Arges",
  "Bacau",
  "Bihor",
  "Bistrita-Nasaud",
  "Botosani",
  "Brasov",
  "Braila",
  "Buzau",
  "Caras-Severin",
  "Calarasi",
  "Cluj",
  "Constanta",
  "Covasna",
  "Dambovita",
  "Dolj",
  "Galati",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomita",
  "Iasi",
  "Ilfov",
  "Maramures",
  "Mehedinti",
  "Mures",
  "Neamt",
  "Olt",
  "Prahova",
  "Satu Mare",
  "Salaj",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timis",
  "Tulcea",
  "Vaslui",
  "Valcea",
  "Vrancea",
  "Bucuresti",
] as const;

function isValidJudet(j: string | null | undefined): boolean {
  if (!j || !j.trim()) return false;
  const n = j.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return JUDETE.some(
    (x) => x.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === n
  );
}

export function validatePnrrPlata(draft: PnrrDraft): PnrrValidation {
  const issues: string[] = [];
  let coreFilled = 0;
  let extraFilled = 0;

  for (const key of CORE) {
    const v = draft[key];
    const ok =
      key === "suma"
        ? typeof v === "number" && Number.isFinite(v) && v > 0
        : typeof v === "string" && v.trim().length > 0;
    if (ok) coreFilled++;
    else issues.push("Lipsa sau invalid: " + key);
  }

  for (const key of EXTRA) {
    const v = draft[key];
    let ok = typeof v === "string" && v.trim().length > 0;
    if (key === "judet" && ok && !isValidJudet(v as string)) {
      ok = false;
      issues.push("Judet invalid (nu e in lista 42): " + v);
    }
    if (ok) extraFilled++;
    else if (key !== "judet" || !v) issues.push("Lipsa sau invalid: " + key);
  }

  const total = CORE.length + EXTRA.length;
  const filled = coreFilled + extraFilled;
  const score = Math.round((filled / total) * 100);

  let dataStatus: PnrrValidation["dataStatus"];
  if (coreFilled === 0) {
    dataStatus = "MISSING_DATA";
  } else if (coreFilled < CORE.length) {
    dataStatus = "INSUFFICIENT_DATA";
  } else if (filled === total) {
    dataStatus = "COMPLETE";
  } else {
    // Are nucleul (beneficiar+suma+dată) → publicabil, chiar dacă lipsește componenta
    dataStatus = "INSUFFICIENT_DATA";
  }

  return {
    dataStatus,
    completenessScore: score,
    reportJson: JSON.stringify({
      score,
      coreFilled,
      extraFilled,
      issues,
      checkedAt: new Date().toISOString(),
    }),
    issues,
  };
}
