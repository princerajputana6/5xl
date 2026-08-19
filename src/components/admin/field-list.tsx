"use client";

import * as React from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Editor for a simple ordered list of strings (benefits, ingredients).
 * Enter adds the next row so a whole list can be typed without reaching for
 * the mouse.
 */
export function FieldList({
  value,
  onChange,
  placeholder,
  addLabel = "Add row",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const lastRef = React.useRef<HTMLInputElement>(null);
  // A ref rather than state: this only needs to survive until the next commit,
  // and flipping state here would re-render for nothing.
  const focusLast = React.useRef(false);

  React.useEffect(() => {
    if (focusLast.current) {
      focusLast.current = false;
      lastRef.current?.focus();
    }
  });

  const update = (i: number, v: string) =>
    onChange(value.map((row, idx) => (idx === i ? v : row)));

  const add = () => {
    focusLast.current = true;
    onChange([...value, ""]);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="group flex items-center gap-2">
          <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
          <Input
            ref={i === value.length - 1 ? lastRef : undefined}
            value={row}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button
            type="button"
            aria-label="Remove row"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1.5 size-4" />
        {addLabel}
      </Button>
    </div>
  );
}

export type NutritionRow = { label: string; value: string };

/** Two-column editor for the nutrition facts table. */
export function NutritionEditor({
  value,
  onChange,
}: {
  value: NutritionRow[];
  onChange: (next: NutritionRow[]) => void;
}) {
  const update = (i: number, patch: Partial<NutritionRow>) =>
    onChange(value.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-xs font-medium text-muted-foreground">
          <span>Nutrient</span>
          <span>Per serving</span>
          <span className="w-8" />
        </div>
      )}

      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <Input
            value={row.label}
            placeholder="Protein"
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <Input
            value={row.value}
            placeholder="24 g"
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            type="button"
            aria-label="Remove nutrient"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { label: "", value: "" }])}
      >
        <Plus className="mr-1.5 size-4" />
        Add nutrient
      </Button>
    </div>
  );
}
