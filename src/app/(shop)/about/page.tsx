import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AtSign, ShieldCheck, FlaskConical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  aboutIntro,
  aboutStats,
  aboutJourney,
  aboutTeam,
  aboutProcess,
  aboutCertifications,
  aboutComparison,
  companyDetails,
  aboutFaqs,
} from "@/lib/about-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The 5XL Nutrition — Indian sports nutrition, manufactured in-house at our own FSSAI-licensed facility in Kanina, Haryana. Formulated by athletes, batch-tested, no proprietary blends.",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-8 w-1.5 shrink-0 rounded-full bg-primary" />
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
        {children}
      </h2>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 15% 0%, oklch(0.86 0.18 96 / 0.22), transparent 60%)",
          }}
        />
        <div className="container-5xl relative py-16 md:py-24">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            {aboutIntro.subhead}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-6xl">
            {aboutIntro.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-white/75 md:text-lg">{aboutIntro.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products">
                Shop all products <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/faq">Read the FAQ</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30">
        <div className="container-5xl grid grid-cols-2 gap-4 py-10 md:grid-cols-4 md:py-12">
          {aboutStats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-display text-2xl font-extrabold text-primary md:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story / journey */}
      <section className="container-5xl py-12 md:py-16">
        <SectionTitle>From the platform to the production line</SectionTitle>
        <p className="max-w-3xl text-muted-foreground">
          The 5XL Nutrition was built to close a gap every Indian lifter knows: impressive front
          labels, unverifiable backs, and imported tubs sold by people who never competed. Rather
          than buying finished powder from an unnamed contract manufacturer, we built and licensed
          our own plant. It is the slower, more capital-intensive way — and the only way to genuinely
          control what ends up in the tub.
        </p>
        <ol className="mt-8 space-y-4 border-l-2 border-border pl-6">
          {aboutJourney.map((j) => (
            <li key={j.year} className="relative">
              <span className="absolute -left-[1.65rem] top-1 size-3 rounded-full border-2 border-primary bg-background" />
              <p className="font-display text-lg font-bold uppercase tracking-tight text-primary">
                {j.year}
              </p>
              <p className="text-sm text-muted-foreground">{j.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Team */}
      <section className="border-y border-border bg-muted/30">
        <div className="container-5xl py-12 md:py-16">
          <SectionTitle>The people behind 5XL</SectionTitle>
          <div className="grid gap-5 md:grid-cols-3">
            {aboutTeam.map((m) => (
              <div key={m.name} className="rounded-2xl border border-border bg-card p-6">
                <p className="font-display text-xl font-extrabold uppercase tracking-tight">
                  {m.name}
                </p>
                <p className="text-sm font-semibold text-primary">{m.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.bio}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <AtSign className="size-4" /> {m.instagram}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it's made */}
      <section className="container-5xl py-12 md:py-16">
        <SectionTitle>How our supplements are made</SectionTitle>
        <p className="max-w-3xl text-muted-foreground">
          We own our manufacturing — a 15,000 sq ft plant on Anita Road, Kanina, Mahendragarh,
          Haryana. Not white-labelled from a third-party unit and re-branded, which is how most
          Indian supplement labels are actually produced.
        </p>
        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {aboutProcess.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>

        {/* Certifications */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Certification</th>
                  <th className="px-4 py-3 font-semibold">Number</th>
                  <th className="px-4 py-3 font-semibold">Issued by</th>
                  <th className="px-4 py-3 font-semibold">Valid until</th>
                </tr>
              </thead>
              <tbody>
                {aboutCertifications.map((c) => (
                  <tr key={c.number} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.issuer}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{c.validUntil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Verify our FSSAI licence yourself: enter 13322999001439 at foscos.fssai.gov.in. We
          publish the number in full text for exactly that reason.
        </p>
      </section>

      {/* Comparison */}
      <section className="border-y border-border bg-muted/30">
        <div className="container-5xl py-12 md:py-16">
          <SectionTitle>What makes 5XL different</SectionTitle>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th className="px-4 py-3" />
                    <th className="px-4 py-3 font-semibold text-muted-foreground">
                      Typical Indian brand
                    </th>
                    <th className="px-4 py-3 font-semibold text-primary">The 5XL Nutrition</th>
                  </tr>
                </thead>
                <tbody>
                  {aboutComparison.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{row.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.typical}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                          {row.fivexl}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Authenticity */}
      <section className="container-5xl py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <ShieldCheck className="size-8 text-primary" />
            <h3 className="mt-3 font-display text-xl font-extrabold uppercase tracking-tight">
              Buy genuine, be safe
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every 5XL Nutrition product carries a unique verification code — a scratch or QR code
              on the pack. Scratch it, enter it, and get an instant answer with your batch number,
              manufacturing date and expiry. If a code returns invalid, email us at
              5xlnutrition@gmail.com with your order number and photos, and we will act.
              <span className="mt-2 block font-semibold text-foreground">#Buy_Genuine_Be_Safe</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <FlaskConical className="size-8 text-primary" />
            <h3 className="mt-3 font-display text-xl font-extrabold uppercase tracking-tight">
              No proprietary blends. Ever.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every label declares the exact quantity of every active ingredient per serving. We
              screen the free-form amino acid profile against declared protein content to guard
              against amino spiking. If a product says 24 g of protein, the label says 24 g — and
              the batch test confirms 24 g.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ (from about content) */}
      <section className="border-t border-border bg-muted/30">
        <div className="container-5xl py-12 md:py-16">
          <SectionTitle>Frequently asked</SectionTitle>
          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {aboutFaqs.slice(0, 6).map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-6 text-center">
            <Button asChild variant="outline">
              <Link href="/faq">See all FAQs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact / company */}
      <section className="container-5xl py-12 md:py-16">
        <SectionTitle>Contact & company details</SectionTitle>
        <dl className="grid gap-3 sm:grid-cols-2">
          {companyDetails.map((d) => (
            <div key={d.label} className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{d.label}</dt>
              <dd className="mt-1 text-sm font-medium">{d.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
