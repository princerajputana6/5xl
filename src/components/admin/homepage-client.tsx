"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { HomeContentDTO } from "@/server/services/home.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/admin/image-uploader";

type Slide = HomeContentDTO["heroSlides"][number];
type Feature = HomeContentDTO["features"][number];

const EMPTY_SLIDE: Slide = { eyebrow: "", title: "", subtitle: "", ctaLabel: "", ctaHref: "", image: "" };
const EMPTY_FEATURE: Feature = { icon: "", title: "", desc: "" };

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border p-6">
      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function HomepageClient({
  content,
  categories,
}: {
  content: HomeContentDTO;
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState(content.announcement);
  const [sectionTitle, setSectionTitle] = React.useState(content.categorySectionTitle);
  const [showFeatured, setShowFeatured] = React.useState(content.showFeatured);
  const [showBestsellers, setShowBestsellers] = React.useState(content.showBestsellers);
  const [slides, setSlides] = React.useState<Slide[]>(content.heroSlides);
  const [features, setFeatures] = React.useState<Feature[]>(content.features);
  const [featuredSlugs, setFeaturedSlugs] = React.useState<string[]>(content.featuredCategorySlugs);

  function updateSlide(i: number, patch: Partial<Slide>) {
    setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }
  function moveSlide(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= slides.length) return;
    setSlides((s) => {
      const next = [...s];
      [next[i], next[t]] = [next[t], next[i]];
      return next;
    });
  }
  function updateFeature(i: number, patch: Partial<Feature>) {
    setFeatures((f) => f.map((ft, idx) => (idx === i ? { ...ft, ...patch } : ft)));
  }

  function toggleSlug(slug: string) {
    setFeaturedSlugs((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]
    );
  }

  async function save() {
    setPending(true);
    const payload = {
      announcement: announcement.trim() || undefined,
      categorySectionTitle: sectionTitle.trim() || undefined,
      showFeatured,
      showBestsellers,
      featuredCategorySlugs: featuredSlugs,
      heroSlides: slides
        .filter((s) => s.title.trim())
        .map((s) => ({
          eyebrow: s.eyebrow || undefined,
          title: s.title,
          subtitle: s.subtitle || undefined,
          ctaLabel: s.ctaLabel || undefined,
          ctaHref: s.ctaHref || undefined,
          image: s.image || undefined,
        })),
      features: features
        .filter((f) => f.title.trim())
        .map((f) => ({ icon: f.icon || undefined, title: f.title, desc: f.desc || undefined })),
    };
    const res = await fetch("/api/admin/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not save homepage.");
      return;
    }
    toast.success("Homepage saved.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">Homepage</h1>
          <p className="text-sm text-muted-foreground">Edit the storefront hero, banners and sections.</p>
        </div>
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save changes
        </Button>
      </div>

      <Section title="Announcement bar" hint="The thin ribbon across the very top of every page.">
        <Input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
      </Section>

      <Section title="Hero slides" hint="The big banner at the top of the homepage.">
        <div className="space-y-4">
          {slides.map((s, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
              <div className="flex items-center justify-between sm:col-span-2">
                <p className="text-sm font-semibold">Slide {i + 1}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => moveSlide(i, -1)} aria-label="Up">
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={i === slides.length - 1} onClick={() => moveSlide(i, 1)} aria-label="Down">
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setSlides((sl) => sl.filter((_, idx) => idx !== i))}
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Eyebrow</Label>
                <Input value={s.eyebrow} onChange={(e) => updateSlide(i, { eyebrow: e.target.value })} placeholder="Fuel Beyond Limits" />
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={s.title} onChange={(e) => updateSlide(i, { title: e.target.value })} placeholder="Protein that powers your goals" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Subtitle</Label>
                <Input value={s.subtitle} onChange={(e) => updateSlide(i, { subtitle: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Button label</Label>
                <Input value={s.ctaLabel} onChange={(e) => updateSlide(i, { ctaLabel: e.target.value })} placeholder="Shop all products" />
              </div>
              <div className="space-y-1.5">
                <Label>Button link</Label>
                <Input value={s.ctaHref} onChange={(e) => updateSlide(i, { ctaHref: e.target.value })} placeholder="/products" className="font-mono" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Background image (optional)</Label>
                <ImageUploader value={s.image ? [s.image] : []} onChange={(next) => updateSlide(i, { image: next[0] ?? "" })} />
              </div>
            </div>
          ))}
          {slides.length < 6 && (
            <Button variant="outline" onClick={() => setSlides((s) => [...s, { ...EMPTY_SLIDE }])}>
              <Plus className="mr-1 size-4" /> Add slide
            </Button>
          )}
        </div>
      </Section>

      <Section title="Category section" hint="Choose which categories appear in the homepage grid (leave all unchecked to show every active category, in their saved order).">
        <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Shop by category" />
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories yet — add some under Categories.</p>
          )}
          {categories.map((c) => {
            const on = featuredSlugs.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleSlug(c.slug)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Why-choose-us strip" hint="The trust badges shown just under the hero.">
        <div className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <Input value={f.icon} onChange={(e) => updateFeature(i, { icon: e.target.value })} placeholder="ShieldCheck" />
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={f.title} onChange={(e) => updateFeature(i, { title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={f.desc} onChange={(e) => updateFeature(i, { desc: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setFeatures((ft) => ft.filter((_, idx) => idx !== i))}
                  aria-label="Remove"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {features.length < 8 && (
            <Button variant="outline" onClick={() => setFeatures((f) => [...f, { ...EMPTY_FEATURE }])}>
              <Plus className="mr-1 size-4" /> Add item
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Icon names come from lucide.dev (e.g. ShieldCheck, Truck, FlaskConical, BadgeCheck).
          </p>
        </div>
      </Section>

      <Section title="Sections" hint="Toggle homepage product rows.">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showFeatured} onCheckedChange={(v) => setShowFeatured(v === true)} />
          Show “Featured” products row
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showBestsellers} onCheckedChange={(v) => setShowBestsellers(v === true)} />
          Show “Bestsellers” row
        </label>
      </Section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending} size="lg">
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
