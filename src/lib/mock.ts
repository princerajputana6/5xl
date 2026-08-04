/**
 * Placeholder catalogue data for M1. Replaced by real DB-backed queries at M2.
 */
export const mockCategories = [
  { name: "Whey Protein", slug: "protein", emoji: "🥛", blurb: "Build & recover" },
  { name: "Creatine", slug: "creatine", emoji: "⚡", blurb: "Power & strength" },
  { name: "Mass Gainer", slug: "mass-gainer", emoji: "🍚", blurb: "Serious size" },
  { name: "Pre-Workout", slug: "pre-workout", emoji: "🔥", blurb: "Explosive energy" },
  { name: "BCAA & EAA", slug: "bcaa", emoji: "🧬", blurb: "Recover faster" },
  { name: "Vitamins", slug: "vitamins", emoji: "💊", blurb: "Daily health" },
] as const;

export const mockGoals = [
  { name: "Build Muscle", slug: "muscle", desc: "High-protein stacks for hypertrophy." },
  { name: "Lose Fat", slug: "fat-loss", desc: "Lean nutrition to cut without losing gains." },
  { name: "Boost Performance", slug: "performance", desc: "Fuel that keeps up with your training." },
  { name: "Everyday Health", slug: "wellness", desc: "Vitamins and essentials for daily wellness." },
] as const;

export const mockFeatures = [
  { title: "Lab-Tested", desc: "Every batch third-party tested for purity & label accuracy." },
  { title: "Fast Delivery", desc: "Dispatched within 24h, delivered across India in 2–5 days." },
  { title: "Authentic Only", desc: "Sourced direct — zero fakes, guaranteed or money back." },
  { title: "Expert Backed", desc: "Formulated with coaches and sports nutritionists." },
] as const;
