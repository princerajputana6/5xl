"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Cancels an unpaid order after an explicit confirmation step. */
export function CancelOrderButton({
  orderNumber,
  className,
}: {
  orderNumber: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function cancel() {
    setPending(true);
    const res = await fetch(`/api/orders/${orderNumber}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not cancel this order.");
      return;
    }

    toast.success(`Order ${orderNumber} cancelled.`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive ${className ?? ""}`}
        >
          <XCircle className="mr-1.5 size-4" />
          Cancel order
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel order {orderNumber}?</DialogTitle>
          <DialogDescription>
            This order is still awaiting payment, so nothing has been charged or shipped.
            Cancelling it can&apos;t be undone — you&apos;d need to place a new order.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={pending}>
              Keep order
            </Button>
          </DialogClose>
          <Button
            onClick={cancel}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Yes, cancel it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
