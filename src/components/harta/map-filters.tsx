"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RISC_SCALE, type NivelRisc } from "@/lib/risc-colors";

export type MapFilterState = {
  riscuri: NivelRisc[];
  status: string; // "all" | exact
  onlyDelayed: boolean;
  onlyOverrun: boolean;
  minProgres: number;
  maxProgres: number;
};

export const defaultMapFilters: MapFilterState = {
  riscuri: [],
  status: "all",
  onlyDelayed: false,
  onlyOverrun: false,
  minProgres: 0,
  maxProgres: 100,
};

type Props = {
  value: MapFilterState;
  onChange: (v: MapFilterState) => void;
  statusOptions: string[];
  resultCount: number;
};

export function MapFilters({
  value,
  onChange,
  statusOptions,
  resultCount,
}: Props) {
  const levels = RISC_SCALE.filter((x) => x.key !== "critic");

  function toggleRisc(key: NivelRisc) {
    const has = value.riscuri.includes(key);
    onChange({
      ...value,
      riscuri: has
        ? value.riscuri.filter((r) => r !== key)
        : [...value.riscuri, key],
    });
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Filtrare avansata</CardTitle>
        <CardDescription>
          Combină risc, status, intarzieri si depasiri · {resultCount} proiecte
          afisate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium mb-2">Risc (multi-select)</p>
          <div className="flex flex-wrap gap-2">
            {levels.map((item) => {
              const active = value.riscuri.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleRisc(item.key)}
                  className={
                    "flex items-center gap-2 rounded-md border px-3 py-1.5 " +
                    (active ? "ring-2 ring-offset-1 ring-foreground/30" : "")
                  }
                  style={active ? { borderColor: item.hex } : undefined}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: item.hex }}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gol = toate nivelurile de risc
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-medium mb-1">Status</p>
            <select
              className="w-full h-9 rounded-md border bg-background px-2"
              value={value.status}
              onChange={(e) => onChange({ ...value, status: e.target.value })}
            >
              <option value="all">Toate</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.onlyDelayed}
                onChange={(e) =>
                  onChange({ ...value, onlyDelayed: e.target.checked })
                }
              />
              Doar cu intarziere
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.onlyOverrun}
                onChange={(e) =>
                  onChange({ ...value, onlyOverrun: e.target.checked })
                }
              />
              Doar cu depasire buget
            </label>
          </div>
        </div>

        <div>
          <p className="font-medium mb-1">
            Progres: {value.minProgres}% – {value.maxProgres}%
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="range"
              min={0}
              max={100}
              value={value.minProgres}
              onChange={(e) =>
                onChange({
                  ...value,
                  minProgres: Math.min(Number(e.target.value), value.maxProgres),
                })
              }
              className="w-full"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={value.maxProgres}
              onChange={(e) =>
                onChange({
                  ...value,
                  maxProgres: Math.max(Number(e.target.value), value.minProgres),
                })
              }
              className="w-full"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(defaultMapFilters)}
        >
          Reseteaza filtre
        </Button>
      </CardContent>
    </Card>
  );
}
