"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent-v1";

type WindowWithDataLayer = Window & {
  dataLayer?: Record<string, unknown>[];
};

/**
 * Cookie consent banner. Shown on a visitor's first arrival until they choose
 * Accept or Decline; the choice is remembered in localStorage so it never
 * reappears. The decision is also pushed to the GTM dataLayer so tags can be
 * gated on consent if configured.
 */
export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Defer out of the synchronous effect body; also lets the page settle
    // before the banner slides in.
    const t = window.setTimeout(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch {
        /* private mode / blocked storage — just don't show it */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  function decide(choice: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    try {
      const w = window as WindowWithDataLayer;
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ event: "cookie_consent", cookie_consent: choice });
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-16 z-50 px-3 lg:bottom-0 lg:px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto mb-3 flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/20 sm:flex-row sm:items-center lg:mb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Cookie className="size-5" />
        </span>
        <p className="flex-1 text-sm text-muted-foreground">
          We use cookies to improve your experience, analyse traffic and remember your
          preferences. By clicking <strong className="text-foreground">Accept</strong> you agree to
          our{" "}
          <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("declined")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
