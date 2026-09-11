import { getHomeContent } from "@/server/services/home.service";

/**
 * Thin promo ribbon. Text is managed from the admin Homepage CMS; multiple
 * messages can be separated with a middot ("·") and rotate in on wider screens.
 */
export async function AnnouncementBar() {
  const { announcement } = await getHomeContent();
  const messages = announcement
    .split("·")
    .map((m) => m.trim())
    .filter(Boolean);

  if (messages.length === 0) return null;

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container-5xl flex h-9 items-center justify-center gap-8 overflow-hidden text-xs font-medium">
        {messages.map((m, i) => (
          <span key={i} className={i > 0 ? "hidden sm:inline" : ""}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
