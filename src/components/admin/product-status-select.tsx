"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["active", "draft", "archived"] as const;

export function ProductStatusSelect({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(status);
  const [pending, setPending] = React.useState(false);

  async function change(next: string) {
    const prev = value;
    setValue(next);
    setPending(true);
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setStatus: next }),
    });
    setPending(false);
    if (!res.ok) {
      setValue(prev);
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not update status.");
      return;
    }
    toast.success(`Marked ${next}.`);
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={change} disabled={pending}>
      <SelectTrigger className="h-8 w-32 capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
