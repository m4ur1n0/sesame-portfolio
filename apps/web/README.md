# Sesame Campbell — portfolio

Live: https://sesame-portfolio.thjmaurino.workers.dev

## How it fits together

One Cloudflare Worker serves everything. It is the Next.js app, built for Workers by
[OpenNext](https://opennext.js.org/cloudflare), with two bindings:

| Binding | Resource | Holds |
| --- | --- | --- |
| `DB` | D1 `sesame-portfolio-db` | artworks, inquiries, login attempts (`migrations/`) |
| `MEDIA` | R2 `sesame-portfolio-media` | images, as `<id>/thumb.<ext>` and `<id>/large.<ext>` |

- **Public pages** (`app/(public)`) read D1 on every request (`lib/db.ts`). There is no
  cache to invalidate, so publishing is instant.
- **Images** are resized in the admin's browser before upload (`lib/resize.ts`): a 2400px
  large variant and a 1200px thumb, as WebP or JPEG. Originals never leave the artist's
  machine. Files are served at `/media/*` with immutable caching and are deleted from R2
  when removed from an artwork or when the artwork is deleted.
- **Admin** (`/admin`) uses server components and server actions (`app/admin/actions.ts`).
  Sign-in sets an HMAC-signed HttpOnly cookie (`lib/auth.ts`). Every admin read and action
  checks the session. Sign-in locks out an IP after 5 failures in 15 minutes.
- **Contact** submissions are checked with Turnstile and land in **Admin → Inbox**
  (with an unread badge).
- Site copy lives in `lib/site.ts`.

Everything runs on Cloudflare's free tiers.

## Commands

```bash
npm install
npm run deploy        # OpenNext build + wrangler deploy
npm run db:migrate    # apply new files in migrations/ to the remote D1
npm run typecheck && npm run lint && npm run build
BASE_URL=https://… ADMIN_PASSWORD=… npm run test:e2e   # browser test against a deployment
```

`npm run dev` needs the local Workers runtime (macOS 13.5+ or Linux). On older macOS,
verify changes by deploying and running `test:e2e`, which drives the installed Google
Chrome and cleans up everything it creates.

## Secrets

Set with `npx wrangler secret put <NAME>`:

- `ADMIN_PASSWORD`: the admin sign-in password
- `SESSION_SECRET`: random string (`openssl rand -hex 32`). Changing it signs everyone out.
- `TURNSTILE_SECRET_KEY`: from the Turnstile widget. Its site key is `TURNSTILE_SITE_KEY`
  in `wrangler.jsonc`, and the widget's allowed hostnames must include the site's domain.

## When the site gets its own domain

Add the domain to this Cloudflare account (DNS is free), then:

1. **Worker:** add a custom domain to the `sesame-portfolio` Worker, update `SITE.url` in
   `lib/site.ts`, and add the hostname to the Turnstile widget.
2. **Images straight from the CDN:** connect a custom domain such as `media.<domain>` to
   the R2 bucket and set `MEDIA_BASE` in `lib/media.ts` to it. Image requests then stop
   invoking the Worker (and stop counting toward its 100k requests/day free limit).
3. **Inquiry emails:** enable Email Routing, verify the artist's inbox as a destination,
   add a `send_email` binding, and send a notification from `submitInquiry`.
4. **Optional:** put Cloudflare Access (free, up to 50 users) in front of `/admin*` for
   email-code sign-in instead of a password.
