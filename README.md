This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare Workers

This app runs on [Cloudflare Workers](https://developers.cloudflare.com/workers/) via the
[OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). Config lives in
`wrangler.jsonc` and `open-next.config.ts`.

### Local preview (Workers runtime)

```bash
# .dev.vars holds the runtime env for preview (gitignored; mirror of .env.local)
npm run preview   # builds with OpenNext and serves on http://localhost:8787
```

### Deploy

```bash
npx wrangler login
# set runtime secrets (not committed):
npx wrangler secret put MONGODB_URI
npx wrangler secret put AUTH_SECRET
npx wrangler secret put AUTH_URL
# optional integrations:
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET

npm run deploy
```

Public build-time vars (e.g. `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GTM_ID`) must be present at
build time — keep them in `.env.local`, or set them as Cloudflare build env vars in CI.

### Notes

- **MongoDB** works on Workers through `nodejs_compat` (compat date ≥ 2025-03-20) with mongoose 9.
- **Image uploads** must use Cloudinary in production — the local-disk fallback in
  `src/server/media/storage.ts` cannot write to the read-only Workers filesystem. Set the
  `CLOUDINARY_*` secrets (or migrate the fallback to R2).
- **next/image** optimization is disabled (`images.unoptimized`) because Workers lack `sharp`.
