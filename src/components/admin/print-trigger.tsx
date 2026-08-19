"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Opens the print dialog once the report has rendered. The browser's
 * "Save as PDF" destination produces the downloadable file.
 */
export function PrintTrigger() {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // A beat for fonts and layout to settle before the dialog snapshots.
    const id = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-6 py-3 print:hidden">
      <p className="text-sm text-muted-foreground">
        Choose <strong>Save as PDF</strong> as the destination to download this report.
      </p>
      <Button onClick={() => window.print()} size="sm">
        <Printer className="mr-1.5 size-4" />
        Print / Save PDF
      </Button>
    </div>
  );
}
