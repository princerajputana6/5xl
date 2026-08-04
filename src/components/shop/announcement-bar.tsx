const messages = [
  "⚡ Free shipping on orders over ₹999",
  "🔬 100% lab-tested & authenticity guaranteed",
  "🎁 Extra 5% off on your first subscription",
];

export function AnnouncementBar() {
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
