"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { Plus, HelpCircle } from "lucide-react";
import type { ProductFaq } from "@/lib/product-faq";

/**
 * FAQ accordion with a numbered index, an animated plus/minus toggle and a
 * staggered reveal on the answer body.
 */
export function ProductFaqs({ faqs }: { faqs: ProductFaq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="flex items-center gap-2.5 font-display text-2xl font-extrabold uppercase tracking-tight">
        <HelpCircle className="size-5 text-primary" />
        Frequently Asked Questions
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything people usually ask before their first order.
      </p>

      <AccordionPrimitive.Root type="single" collapsible className="mt-6 max-w-3xl space-y-3">
        {faqs.map((faq, i) => (
          <AccordionPrimitive.Item
            key={faq.question}
            value={`faq-${i}`}
            className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/60 data-[state=open]:border-primary/70 data-[state=open]:shadow-md"
          >
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent/40">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xs font-bold transition-all duration-300 group-data-[state=open]:scale-110 group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="flex-1 text-sm font-semibold leading-snug transition-colors group-data-[state=open]:text-primary">
                  {faq.question}
                </span>

                {/* Plus rotates into a minus as the panel opens */}
                <span className="relative grid size-7 shrink-0 place-items-center rounded-full border border-border transition-all duration-300 group-hover:border-primary group-data-[state=open]:rotate-45 group-data-[state=open]:border-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                  <Plus className="size-4" />
                </span>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>

            <AccordionPrimitive.Content
              data-slot="accordion-content"
              className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            >
              <div className="animate-in fade-in slide-in-from-top-1 border-t border-border/70 px-5 py-4 pl-[4.25rem] text-sm leading-relaxed text-muted-foreground duration-300">
                {faq.answer}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </section>
  );
}
