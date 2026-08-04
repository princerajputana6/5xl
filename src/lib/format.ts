const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format a number of rupees as INR, e.g. 1499 -> "₹1,499". */
export function formatINR(amount: number): string {
  return inrFormatter.format(amount);
}

/** Percentage off given MRP and selling price. Returns 0 if not discounted. */
export function discountPct(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(date: Date | string | number): string {
  return dateFormatter.format(new Date(date));
}
