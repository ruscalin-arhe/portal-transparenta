"use client";

import { useState } from "react";
import { RISC_SCALE, type NivelRisc } from "@/lib/risc-colors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

type Props = {
  activeFilter: NivelRisc | "all";
  onFilterChange: (v: NivelRisc | "all") => void;
  counts?: Partial<Record<NivelRisc | "all", number>>;
};

export function RiscLegend({ activeFilter, onFilterChange, counts }: Props) {
  const [open, setOpen] = useState(true);
  const levels = RISC_SCALE.filter((x) => x.key !== "critic");

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Cod risc (scara semafor)</CardTitle>
              <CardDescription className="text-xs">
                Click pe o culoare pentru a filtra pinurile · legenda administrativa
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 gap-1"
          >
            {open ? (
              <>
                Ascunde <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                Explica culorile <ChevronDown className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFilterChange("all")}
              className={
                "rounded-md border px-3 py-2 text-sm transition-colors " +
                (activeFilter === "all"
                  ? "ring-2 ring-offset-2 ring-foreground/40 bg-muted"
                  : "hover:bg-muted/60")
              }
            >
              Toate{counts?.all != null ? ` (${counts.all})` : ""}
            </button>
            {levels.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  onFilterChange(
                    activeFilter === item.key ? "all" : item.key
                  )
                }
                className={
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors " +
                  (activeFilter === item.key
                    ? "ring-2 ring-offset-2 ring-foreground/40"
                    : "hover:bg-muted/60")
                }
                style={
                  activeFilter === item.key
                    ? { borderColor: item.hex }
                    : undefined
                }
              >
                <span
                  className="size-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="font-medium" style={{ color: item.hex }}>
                  {item.label}
                </span>
                {counts?.[item.key] != null ? (
                  <span className="text-muted-foreground text-xs">
                    ({counts[item.key]})
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <ul className="space-y-2 text-sm border-t pt-3">
            {levels.map((item) => (
              <li key={item.key} className="flex gap-3">
                <span
                  className="mt-1 size-3 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: item.hex }}
                />
                <span>
                  <span className="font-medium" style={{ color: item.hex }}>
                    {item.label}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {item.descriere}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            In popup-ul pinului, detaliile de risc folosesc aceeasi culoare ca
            markerul. Textul ramane lizibil; culoarea e accent, nu singurul semnal.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
