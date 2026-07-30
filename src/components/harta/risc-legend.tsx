import { RISC_SCALE } from "@/lib/risc-colors";

export function RiscLegend() {
  return (
    <div className="rounded-lg border bg-card p-4 text-sm">
      <p className="font-medium mb-1">Cod risc (scara administrativa)</p>
      <p className="text-xs text-muted-foreground mb-3">
        Semantica tip semafor, folosita in monitorizare de proiecte, control
        intern si raportare catre conducere.
      </p>
      <ul className="space-y-2">
        {RISC_SCALE.filter((x) => x.key !== "critic").map((item) => (
          <li key={item.key} className="flex items-start gap-3">
            <span
              className="mt-0.5 size-3.5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: item.hex }}
              aria-hidden
            />
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground"> — {item.descriere}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
