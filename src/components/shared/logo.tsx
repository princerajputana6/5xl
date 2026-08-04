import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-baseline font-display font-extrabold tracking-tight",
        className
      )}
      aria-label="5XL home"
    >
      <span className="text-2xl leading-none">5</span>
      <span className="text-2xl leading-none text-primary">XL</span>
      <span className="ml-1 hidden text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:inline">
        Nutrition
      </span>
    </Link>
  );
}
