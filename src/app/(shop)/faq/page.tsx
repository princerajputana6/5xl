import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { aboutFaqs } from "@/lib/about-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about The 5XL Nutrition — ownership, manufacturing, FSSAI licensing, product safety, verification and delivery.",
};

export default function FaqPage() {
  return (
    <div className="container-5xl py-10 md:py-14">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
          <LifeBuoy className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything about how we make, test and stand behind our supplements.
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="mx-auto max-w-3xl">
        {aboutFaqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base font-semibold">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-muted/30 p-6 text-center">
        <p className="font-semibold">Still have a question?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer support: +91 92895 37733 · 5xlnutrition@gmail.com · Mon–Sat, 10 AM–6 PM IST
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/products">Shop products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/about">About us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
