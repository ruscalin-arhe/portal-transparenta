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

const REQUIRED = [
  "componenta",
  "investitie",
  "beneficiar",
  "suma",
  "dataPlata",
  "judet",
] as const;

export function validatePnrrPlata(draft: PnrrDraft): PnrrValidation {
  const issues: string[] = [];
  let filled = 0;
  for (const key of REQUIRED) {
    const v = draft[key];
    const ok =
      key === "suma"
        ? typeof v === "number" && Number.isFinite(v) && v > 0
        : typeof v === "string" && v.trim().length > 0;
    if (ok) filled++;
    else issues.push("Lipsa sau invalid: " + key);
  }
  const score = Math.round((filled / REQUIRED.length) * 100);
  let dataStatus: PnrrValidation["dataStatus"] =
    filled === 0
      ? "MISSING_DATA"
      : filled < REQUIRED.length
        ? "INSUFFICIENT_DATA"
        : "COMPLETE";
  return {
    dataStatus,
    completenessScore: score,
    reportJson: JSON.stringify({
      score,
      issues,
      checkedAt: new Date().toISOString(),
    }),
    issues,
  };
}
