import { Check, BookOpen, ClipboardList } from "lucide-react";

/**
 * "About the Product" panel — the description reads as a lead paragraph, with
 * benefits as a checked list and directions broken into numbered steps.
 */
export function AboutProduct({
  description,
  benefits,
  usage,
}: {
  description?: string;
  benefits: string[];
  usage: string;
}) {
  const steps = splitSteps(usage);

  return (
    <section className="mt-14">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        {/* Description */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7">
          {/* Brand wash in the corner */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/15 blur-2xl"
          />
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />

          <h2 className="flex items-center gap-2.5 font-display text-2xl font-extrabold uppercase tracking-tight">
            <BookOpen className="size-5 text-primary" />
            About the Product
          </h2>

          {description && (
            <p className="relative mt-4 leading-relaxed text-muted-foreground">{description}</p>
          )}

          {benefits.length > 0 && (
            <ul className="relative mt-6 grid gap-2.5 sm:grid-cols-2">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="group flex items-start gap-2.5 rounded-lg border border-border/70 bg-background/60 p-3 text-sm transition-colors hover:border-primary/50"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/20 transition-transform duration-200 group-hover:scale-110">
                    <Check className="size-3 text-primary" />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Directions */}
        <div className="rounded-2xl border border-border bg-muted/30 p-7">
          <h3 className="flex items-center gap-2.5 font-display text-lg font-bold uppercase tracking-tight">
            <ClipboardList className="size-5 text-primary" />
            Directions for Use
          </h3>

          <ol className="mt-5 space-y-4">
            {steps.map((step, i) => (
              <li key={step} className="group relative flex gap-3.5">
                {/* Connector line between steps */}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[0.9rem] top-8 h-[calc(100%-0.5rem)] w-px bg-border"
                  />
                )}
                <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-primary bg-background font-display text-xs font-bold transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Splits directions copy into steps, falling back to sentences. */
function splitSteps(usage: string): string[] {
  const byLine = usage
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;

  const bySentence = usage
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return bySentence.length > 1 ? bySentence : [usage];
}
