import type { ComponentType } from "react";
import {
  FlaskConical,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Star,
  Heart,
  Dumbbell,
  Flame,
  Sparkles,
  Leaf,
  Award,
  Clock,
  Gift,
  PackageCheck,
  ThumbsUp,
  type LucideProps,
} from "lucide-react";

/**
 * Maps the icon *names* stored by the homepage CMS to real lucide components.
 * Admins type a name (e.g. "ShieldCheck"); unknown names fall back to a check.
 */
const ICONS: Record<string, ComponentType<LucideProps>> = {
  FlaskConical,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Star,
  Heart,
  Dumbbell,
  Flame,
  Sparkles,
  Leaf,
  Award,
  Clock,
  Gift,
  PackageCheck,
  ThumbsUp,
};

export function iconByName(name?: string): ComponentType<LucideProps> {
  if (name && ICONS[name]) return ICONS[name];
  return BadgeCheck;
}
