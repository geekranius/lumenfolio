# LumenFolio

**An AI-assisted photography portfolio built on Cloudflare Workers, D1, R2, and Workers AI.**

LumenFolio helps photographers publish and manage a polished portfolio without maintaining a separate server. Its React admin panel handles galleries, photos, events, posts, pages, site settings, and visual design.

## Features

- Responsive galleries with optimized WebP images, multiple sizes, and `srcset`.
- AI-assisted image captions, tags, gallery descriptions, cover selection, and SEO metadata.
- Blog posts with lightweight Markdown and social embeds.
- Event calendar with upcoming and past events.
- Static pages, contact information, social links, and SEO settings.
- Search across photo captions and tags.
- Dark and light themes, design presets, font pairs, accent colors, gallery layouts, hero styles, animation, and texture controls.
- A **Stage / Rock** visual preset with a dark, high-contrast palette, condensed display typography, and restrained crimson accents.
- **AI-powered site-wide redesign through MCP.** The `redesign_site` tool creates and applies a complete visual system across the home page, galleries, posts, events, search, static pages, navigation, and footer.
- **Editable homepage marquee.** Manage its entries from Admin → Settings, one entry per line. Clear the field to hide the marquee.
- Croatian and English interface translations.
- Open Graph metadata for social sharing.
- A Cloudflare one-click deployment flow for new, independent installations.

## Content and data safety

Gallery, photo, event, post, and page records are stored in D1; uploaded media is stored in R2. Design settings and marquee entries are stored in the existing site-settings JSON record. The marquee feature requires no database schema migration.

Applying a design or running the `redesign_site` MCP tool updates visual settings only. It does not delete or rewrite posts, galleries, photos, events, pages, URLs, contact details, or existing features.

**When updating an existing portfolio, deploy against its existing D1 database and R2 bucket.** The all-zero D1 ID in the tracked `wrangler.jsonc` is a placeholder used by the one-click flow to provision a new database. It must not replace the real database binding of an existing site: a newly provisioned empty database would make existing content disappear from the new Worker even though the old records remain in the original database.

## AI redesign through MCP

The MCP server includes `redesign_site`, which accepts a natural-language design brief and uses Workers AI to generate a validated design configuration. It can change:

- Dark and light color palettes, including page, surface, text, muted text, and border colors.
- Accent color, typography, and heading case.
- Hero and gallery layouts, corner radius, grain, and motion.

The result is saved to the existing `site` settings record. Components and routes remain in place, so the portfolio's current content and features continue to work with the new theme. The existing `design_from_prompt` and `apply_design` tools remain available for more focused changes. The MCP endpoint requires an `MCP_API_KEY` or an authenticated admin token.

Example request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "redesign_site",
    "arguments": {
      "prompt": "Create a modern concert photography look: deep charcoal backgrounds, restrained crimson accents, condensed display headlines, editorial image layouts, and subtle motion. Keep the design readable and preserve all existing content."
    }
  }
}
```

## One-click deployment for a new site

The Cloudflare deploy button is intended for a **new, independent installation**, not for replacing the resources of an existing portfolio.

1. Publish this repository to GitHub.
2. Add this button to the repository README or project page:

   ```html
   <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/geekranius/lumenfolio">
     <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" />
   </a>
   ```

3. Sign in to Cloudflare and follow the flow. Cloudflare provisions a Worker, D1 database, R2 bucket, Workers AI binding, and migrations for the new installation.
4. Set the following Worker secrets in Cloudflare Dashboard → Worker → Settings → Variables and Secrets:

   | Secret | Purpose |
   |---|---|
   | `ADMIN_PASSWORD` | Admin sign-in password |
   | `ADMIN_JWT_SECRET` | Secret used to sign admin tokens |
   | `MCP_API_KEY` | Optional key for MCP access |
   | `RAPIDRAW_API_KEY` | Optional key for the RapidRaw publishing integration |

5. Add a custom domain under Worker → Settings → Domains and Routes, if needed.

Workers AI must be enabled for AI-assisted captions and design generation. The rest of the portfolio continues to work if AI is unavailable.

## Existing Cloudflare installation

Before deploying an update, identify and keep the existing Worker, D1 database, R2 bucket, custom domain, and secrets. Do not run the new-install flow for an existing site.

For a local deployment, create an untracked `wrangler.local.jsonc` from the tracked configuration and set its D1 database ID and R2 bucket name to the resources already used by the portfolio. Keep that file and all secrets out of Git. Then use:

```bash
npm run deploy:owner
```

The project intentionally keeps the all-zero D1 ID in the tracked configuration so that the one-click button can provision a fresh database for new users. Never commit account-specific resource IDs or credentials.

## Local development

```bash
npm ci
cp .dev.vars.example .dev.vars
```

Configure the local secrets and use a local D1 database before starting the app:

```bash
npm run db:migrate:local
npm run dev
```

- Frontend: `http://localhost:5173`
- Worker API: `http://localhost:8787`

Build the frontend with:

```bash
npm run build
```

For a new Cloudflare account, the deployment scripts are:

```bash
npx wrangler d1 create lumenfolio-db
npm run db:migrate:remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_JWT_SECRET
npm run deploy
```

For production, set `database_id` in an untracked local Wrangler configuration to the correct D1 database ID before applying migrations or deploying.

## Managing a portfolio

1. Open `/admin` on the deployed site and sign in.
2. Use **New Upload** to choose a folder of photos, add a title, and publish a gallery.
3. Use **Settings** for site details, contact information, SEO, and homepage marquee entries.
4. Use **Design** to preview and publish a design preset, or connect an MCP client and call `redesign_site` with an AI design brief.
5. Use **Posts**, **Events**, and **Pages** to manage the rest of the portfolio.

## RapidRaw integration

RapidRaw can publish a gallery with:

```http
POST /api/rapidraw/publish
Content-Type: application/json
```

```json
{
  "apiKey": "RAPIDRAW_API_KEY",
  "title": "Concert Arena 2026",
  "description": "A photo gallery from the concert",
  "eventDate": "2026-06-15",
  "location": "Zagreb",
  "images": [
    { "url": "https://example.com/photo.jpg" },
    { "data": "<base64 or data URI>", "width": 1600, "height": 1067 },
    {
      "variants": [
        { "width": 320, "data": "<base64>" },
        { "width": 1024, "data": "<base64>" }
      ]
    }
  ]
}
```

The response includes the gallery slug, ID, and number of stored images. `GET /api/rapidraw/health` provides a health check.

## Project structure

```text
src/            Cloudflare Worker API, MCP server, and AI integrations
  api/          API route modules
  lib/          Authentication, AI, D1/R2, image processing, and settings
frontend/       React and Vite application
  src/pages/    Public portfolio routes
  src/admin/    Admin panel
migrations/     D1 schema migrations
wrangler.jsonc  Cloudflare Worker, D1, R2, AI, and static-asset bindings
```

LumenFolio is built with Cloudflare Workers, D1, R2, Workers AI, Hono, React, and Vite.
