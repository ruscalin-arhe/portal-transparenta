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
    const ok = typeof v === "string" && v.trim().length > 0;
    if (ok) extraFilled++;
    else issues.push("Lipsa sau invalid: " + key);
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
