"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  Home,
  Briefcase,
  X,
} from "lucide-react";
import { addressSchema, type AddressInput, ADDRESS_LABELS } from "@/lib/validators/checkout";
import type { SavedAddress } from "@/server/services/address.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const LABEL_ICONS = { Home, Work: Briefcase, Other: MapPin } as const;

/**
 * Saved-address picker used at checkout. Addresses render as selectable cards
 * rather than pre-filling one form, so an account can hold several and the
 * shopper picks per order.
 */
export function AddressBook({
  addresses,
  selectedId,
  onSelect,
  onChanged,
  defaultName,
}: {
  addresses: SavedAddress[];
  selectedId: string | null;
  onSelect: (address: SavedAddress | null) => void;
  /** Re-fetch the list after a create/edit/delete. */
  onChanged: () => void;
  defaultName: string;
}) {
  const [mode, setMode] = React.useState<"list" | "new" | { editing: SavedAddress }>("list");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function remove(a: SavedAddress) {
    if (!confirm(`Delete the address for ${a.name}?`)) return;
    setBusyId(a.id);
    const res = await fetch(`/api/addresses/${a.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not delete that address.");
      return;
    }
    if (selectedId === a.id) onSelect(null);
    toast.success("Address deleted.");
    onChanged();
  }

  async function makeDefault(a: SavedAddress) {
    setBusyId(a.id);
    const res = await fetch(`/api/addresses/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ makeDefault: true }),
    });
    setBusyId(null);
    if (!res.ok) {
      toast.error("Could not set the default address.");
      return;
    }
    toast.success("Default address updated.");
    onChanged();
  }

  if (mode !== "list") {
    const editing = typeof mode === "object" ? mode.editing : undefined;
    return (
      <AddressForm
        initial={editing}
        defaultName={defaultName}
        onCancel={() => setMode("list")}
        onSaved={(saved) => {
          setMode("list");
          onSelect(saved);
          onChanged();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <MapPin className="mx-auto size-7 text-muted-foreground/50" />
          <p className="mt-2 font-medium">No saved addresses</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Add one and it&apos;ll be ready for every future order.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => {
            const selected = a.id === selectedId;
            const Icon = LABEL_ICONS[(a.label ?? "Home") as keyof typeof LABEL_ICONS] ?? MapPin;

            return (
              <li key={a.id}>
                <div
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => onSelect(a)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(a);
                    }
                  }}
                  className={cn(
                    "group relative h-full cursor-pointer rounded-xl border p-4 transition-all duration-200",
                    selected
                      ? "border-primary bg-accent/40 shadow-sm ring-2 ring-primary/25"
                      : "border-border hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm"
                  )}
                >
                  {selected && (
                    <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {a.label ?? "Home"}
                    </span>
                    {a.isDefault && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-medium">{a.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}
                    <br />
                    {a.city}, {a.state} {a.pincode}
                    <br />
                    {a.phone}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode({ editing: a });
                      }}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="size-3" /> Edit
                    </button>

                    {!a.isDefault && (
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          makeDefault(a);
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                      >
                        {busyId === a.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Set default
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(a);
                      }}
                      className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button type="button" variant="outline" onClick={() => setMode("new")} className="w-full">
        <Plus className="mr-1.5 size-4" />
        Add a new address
      </Button>
    </div>
  );
}

/** Create/edit form. Posts straight to the address API. */
function AddressForm({
  initial,
  defaultName,
  onCancel,
  onSaved,
}: {
  initial?: SavedAddress;
  defaultName: string;
  onCancel: () => void;
  onSaved: (a: SavedAddress) => void;
}) {
  const [pending, setPending] = React.useState(false);
  const [label, setLabel] = React.useState<(typeof ADDRESS_LABELS)[number]>(
    (initial?.label as (typeof ADDRESS_LABELS)[number]) ?? "Home"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          phone: initial.phone,
          line1: initial.line1,
          line2: initial.line2,
          city: initial.city,
          state: initial.state,
          pincode: initial.pincode,
          country: initial.country,
        }
      : { name: defaultName, country: "India" },
  });

  async function submit(values: AddressInput) {
    setPending(true);
    const res = await fetch(
      initial ? `/api/addresses/${initial.id}` : "/api/addresses",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, label }),
      }
    );
    const data = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not save the address.");
      return;
    }
    toast.success(initial ? "Address updated." : "Address saved.");
    onSaved(data.address);
  }

  const field = (
    id: keyof AddressInput,
    labelText: string,
    props: React.ComponentProps<typeof Input> = {}
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{labelText}</Label>
      <Input id={id} aria-invalid={Boolean(errors[id])} {...register(id)} {...props} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-border p-5 duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-bold uppercase tracking-tight">
          {initial ? "Edit address" : "New address"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {ADDRESS_LABELS.map((l) => {
          const Icon = LABEL_ICONS[l];
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLabel(l)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-all",
                label === l
                  ? "border-primary bg-accent font-semibold"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className="size-3.5" />
              {l}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Full name", { placeholder: "Recipient's name" })}
        {field("phone", "Phone", { placeholder: "10-digit mobile", inputMode: "numeric" })}
        <div className="sm:col-span-2">
          {field("line1", "Address line 1", { placeholder: "House / flat, street" })}
        </div>
        <div className="sm:col-span-2">
          {field("line2", "Address line 2 (optional)", { placeholder: "Area, landmark" })}
        </div>
        {field("city", "City")}
        {field("state", "State")}
        {field("pincode", "Pincode", { placeholder: "6-digit", inputMode: "numeric" })}
        {field("country", "Country", { placeholder: "India" })}
      </div>

      <div className="mt-5 flex gap-3">
        <Button type="button" onClick={handleSubmit(submit)} disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initial ? "Save changes" : "Save address"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
