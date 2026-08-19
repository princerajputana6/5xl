import { Zap, Dumbbell, ShieldCheck, Timer, Flame, Leaf, Heart, Beaker } from "lucide-react";
import type { BenefitIcon, KeyBenefit } from "@/lib/product-content";

const ICONS: Record<BenefitIcon, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  dumbbell: Dumbbell,
  shield: ShieldCheck,
  timer: Timer,
  flame: Flame,
  leaf: Leaf,
  heart: Heart,
  beaker: Beaker,
};

export function KeyBenefits({ benefits }: { benefits: KeyBenefit[] }) {
  if (benefits.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight">
        Key Benefits
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((b) => {
          const Icon = ICONS[b.icon];
          return (
            <div
              key={b.title}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
            >
              <span className="grid size-11 place-items-center rounded-full bg-primary/15 transition-transform duration-300 group-hover:scale-110">
                <Icon className="size-5 text-primary" />
              </span>
              <p className="mt-4 font-display text-base font-bold uppercase tracking-tight">
                {b.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
