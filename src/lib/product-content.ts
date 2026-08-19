/**
 * Display content for the product detail page.
 *
 * Much of the imported catalogue has empty `benefits` / `usage` / `nutritionFacts`
 * fields, so these helpers derive presentable, category-appropriate copy from the
 * product name and category. Anything the database *does* provide always wins.
 */

export type KeyBenefit = { icon: BenefitIcon; title: string; detail: string };

export type BenefitIcon =
  | "zap"
  | "dumbbell"
  | "shield"
  | "timer"
  | "flame"
  | "leaf"
  | "heart"
  | "beaker";

const CATEGORY_BENEFITS: Record<string, KeyBenefit[]> = {
  creatine: [
    { icon: "zap", title: "More ATP", detail: "Refuels your muscles' primary energy currency between sets." },
    { icon: "dumbbell", title: "Strength gains", detail: "Research-backed increases in maximal strength and power output." },
    { icon: "timer", title: "Delayed fatigue", detail: "Improves anaerobic capacity so you get more quality reps in." },
    { icon: "beaker", title: "Micronized", detail: "Finer particles dissolve faster and absorb more efficiently." },
  ],
  "mass-gainer": [
    { icon: "flame", title: "Calorie dense", detail: "Closes the gap between what you eat and what you need to grow." },
    { icon: "dumbbell", title: "Muscle building", detail: "High-quality protein blend to support lean mass gains." },
    { icon: "timer", title: "Fast recovery", detail: "Carb-to-protein ratio tuned for post-training refuelling." },
    { icon: "beaker", title: "Easy mixing", detail: "Blends smooth in water or milk with no clumping." },
  ],
  "pre-workout": [
    { icon: "zap", title: "Explosive energy", detail: "Kicks in within 20-30 minutes for a stronger session." },
    { icon: "flame", title: "Better pumps", detail: "Supports blood flow to working muscles during training." },
    { icon: "timer", title: "Sharp focus", detail: "Locks you in for heavy compound work and long sessions." },
    { icon: "shield", title: "No crash", detail: "Balanced stimulant profile that tapers off smoothly." },
  ],
  bcaa: [
    { icon: "shield", title: "Muscle sparing", detail: "Helps limit muscle breakdown during fasted or long sessions." },
    { icon: "timer", title: "Faster recovery", detail: "Supports repair so you can train the same muscle sooner." },
    { icon: "leaf", title: "Easy sipping", detail: "Light, refreshing intra-workout drink that goes down easy." },
    { icon: "beaker", title: "Zero sugar", detail: "All the aminos, none of the unnecessary calories." },
  ],
  "performance-protein": [
    { icon: "dumbbell", title: "Lean muscle", detail: "Complete amino profile to build and repair muscle tissue." },
    { icon: "timer", title: "Fast absorbing", detail: "Gets amino acids into your bloodstream when they matter most." },
    { icon: "heart", title: "Keeps you full", detail: "High protein per serving supports appetite control." },
    { icon: "beaker", title: "Lab tested", detail: "Third-party checked for purity and label accuracy." },
  ],
  "pro-series": [
    { icon: "dumbbell", title: "Premium whey", detail: "High-grade concentrate for everyday muscle support." },
    { icon: "timer", title: "Quick recovery", detail: "Post-workout protein hit to kickstart muscle repair." },
    { icon: "heart", title: "Smooth taste", detail: "Mixes clean without the chalky aftertaste." },
    { icon: "shield", title: "Authentic", detail: "Sealed, batch-coded and verified genuine." },
  ],
  wellness: [
    { icon: "heart", title: "Daily support", detail: "Fills the everyday gaps a busy diet tends to leave." },
    { icon: "shield", title: "Immunity", detail: "Micronutrients that support your body's natural defences." },
    { icon: "leaf", title: "Clean formula", detail: "No unnecessary fillers or artificial additives." },
    { icon: "beaker", title: "Precise dosing", detail: "Meaningful amounts, not fairy-dusted label claims." },
  ],
};

const DEFAULT_BENEFITS: KeyBenefit[] = [
  { icon: "shield", title: "100% authentic", detail: "Sourced direct, sealed and batch-coded for verification." },
  { icon: "beaker", title: "Lab tested", detail: "Independently checked for purity and label accuracy." },
  { icon: "dumbbell", title: "Performance first", detail: "Formulated for people who actually train hard." },
  { icon: "leaf", title: "No junk", detail: "No banned substances, no unnecessary fillers." },
];

export function getKeyBenefits(categorySlug: string | null | undefined): KeyBenefit[] {
  if (categorySlug && CATEGORY_BENEFITS[categorySlug]) return CATEGORY_BENEFITS[categorySlug];
  return DEFAULT_BENEFITS;
}

const CATEGORY_USAGE: Record<string, string> = {
  creatine:
    "Loading phase (5-7 days): mix one scoop in 200 ml of water or a non-acidic beverage, four times daily, to saturate your muscles. Maintenance phase: one scoop once daily to keep levels topped up. Drink 4-5 litres of water a day while supplementing.",
  "mass-gainer":
    "Mix 2 scoops in 350-400 ml of water or milk. Take one serving between meals or immediately post-workout. Split the serving across the day if you find a full shake too filling.",
  "pre-workout":
    "Mix one scoop in 250-300 ml of cold water and drink 20-30 minutes before training. Start with half a scoop to assess your tolerance. Avoid within 5-6 hours of bedtime.",
  bcaa: "Mix one scoop in 300-500 ml of cold water and sip during your workout, or through the day for extra amino support. Suitable for fasted training.",
  "performance-protein":
    "Mix one scoop in 200-250 ml of water or milk. Take within 30 minutes post-workout, or any time of day to help hit your daily protein target.",
  "pro-series":
    "Mix one scoop in 200-250 ml of water or milk. Best taken post-workout, or between meals as a high-protein snack.",
  wellness: "Take one serving daily with a meal, or as directed by your healthcare professional.",
};

const DEFAULT_USAGE =
  "Take one serving daily as directed on the label. For best results, pair with consistent training and a balanced diet.";

export function getUsage(
  usage: string | null | undefined,
  categorySlug: string | null | undefined
): string {
  if (usage?.trim()) return usage;
  if (categorySlug && CATEGORY_USAGE[categorySlug]) return CATEGORY_USAGE[categorySlug];
  return DEFAULT_USAGE;
}

/** Grams/servings badge parsed from the product name, e.g. "115G · 38 servings". */
export function getServingInfo(name: string, categorySlug: string | null | undefined): string | null {
  const gram = name.match(/(\d[\d.]*)\s*(?:g|gm|gms|G)\b/);
  const kilo = name.match(/(\d[\d.]*)\s*(?:kg|Kg|KG)\b/);
  const count = name.match(/(\d+)\s*(?:N|caps|capsules|tablets|gummies)\b/i);

  if (count) return `${count[1]} count pack`;

  const grams = kilo ? parseFloat(kilo[1]) * 1000 : gram ? parseFloat(gram[1]) : null;
  if (!grams) return null;

  const perServing =
    categorySlug === "creatine" ? 3 : categorySlug === "mass-gainer" ? 100 : categorySlug === "pre-workout" ? 10 : 30;
  const servings = Math.floor(grams / perServing);
  if (servings < 1) return null;

  const label = kilo ? `${kilo[1]} kg` : `${gram?.[1]}g`;
  return `${label} / ${servings} servings`;
}
