# LumenFolio

**AI fotografski portfolio koji radi besplatno na Cloudflareu** (Workers + R2 + D1 + Workers AI).

Fotograf odabere mapu sa slikama, napiše naziv (koncert, vjenčanje, tema…), a sustav:

- automatski **obrađuje i smanjuje fotografije** (više veličina, WebP, `srcset` → sve responzivno),
- **AI opisuje svaku fotografiju**, dodaje **tagove** (detekcija objekata/scena),
- **AI predlaže naslov, opis i naslovnu sliku** galerije + SEO meta podatke,
- izrađuje **galerije, meni, kalendar događaja**, blog objave, stranice, društvene mreže,
- omogućuje **embed Instagram/TikTok/Facebook/X/YouTube** objava,
- ima **admin panel** za upravljanje i **jedan-klik deploy**.

---

## ⚡ One-click deploy (za fotografe — bez ičega instaliranog)

1. Postavi ovaj repo **javno** na GitHub.
2. U `README` (ili bilo gdje) stavi gumb:

```html
<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/TVOJ_USER/TVOJ_REPO">
  <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare" />
</a>
```

3. Fotograf klikne gumb → prijavi se na Cloudflare → Cloudflare **automatski** napravi:
   - Worker, **D1 bazu**, **R2 bucket**, **Workers AI binding**,
   - pokrene migracije i build → site je **odmah live**.

4. Nakon deploya, fotograf u Cloudflare dashboardu (Worker → Settings → Variables and Secrets) postavi **secrets**:

| Secret | Opis |
|---|---|
| `ADMIN_PASSWORD` | Lozinka za prijavu u `/admin` |
| `ADMIN_JWT_SECRET` | Dugi slučajni string (potpis tokena) |
| `RAPIDRAW_API_KEY` | Ključ za rapidraw-web integraciju (opcionalno) |

> **Napomena:** AI (Workers AI) mora biti omogućen na računu (besplatan je, samo treba biti aktivan u dashboardu). Ako AI nije dostupan, sustav i dalje radi — samo preskače automatske opise.

5. (Opcionalno) Dodaj **vlastitu domenu** u Worker → Settings → Domains.

---

## 🧑‍💻 Lokalni razvoj (za developera)

```bash
npm install

# 1) Kopiraj i uredi secretse
cp .dev.vars.example .dev.vars

# 2) Napravi lokalnu D1 bazu (updatiraj database_id u wrangler.jsonc za produkciju)
npm run db:migrate:local

# 3) Pokreni Worker (API) + Vite (frontend) istovremeno
npm run dev
```

- Frontend: http://localhost:5173
- API/Worker: http://localhost:8787

### Produkcijski deploy (ručno)

```bash
npx wrangler d1 create lumenfolio-db            # ispiše database_id → upiši ga u wrangler.jsonc
npm run db:migrate:remote                        # primijeni migracije
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_JWT_SECRET
npx wrangler secret put RAPIDRAW_API_KEY
npm run deploy                                   # build frontenda + wrangler deploy
```

---

## 📸 Kako fotograf objavljuje novu galeriju

1. Otvori `https://<site>/admin` → prijava lozinkom.
2. **Novi upload** → odabere **mapu** s fotografijama → napiše naziv (npr. „Koncert Arena 2026").
3. Klikne **Objavi** → fotografije se obrađuju i uploadaju, AI u pozadini opisuje i tagira.
4. Galerija se pojavi na stranici, u kalendar (ako je datum postavljen) i u meniju.

---

## 🔌 rapidraw-web integracija

Iz rapidraw-web softvera moguće je **izravno objaviti galeriju** pozivom na:

```
POST /api/rapidraw/publish
```

Tijelo (JSON):

```json
{
  "apiKey": "RAPIDRAW_API_KEY",
  "title": "Koncert Arena 2026",
  "description": "Galerija s koncerta",
  "eventDate": "2026-06-15",
  "location": "Zagreb",
  "images": [
    { "url": "https://.../foto1.jpg" },
    { "data": "<base64 ili data URI>", "width": 1600, "height": 1067 },
    {
      "variants": [
        { "width": 320, "data": "..." },
        { "width": 1024, "data": "..." }
      ]
    }
  ]
}
```

Odgovor: `{ "ok": true, "slug": "koncert-arena-2026", "galleryId": "...", "imagesStored": 12 }`

JavaScript primjer:

```js
await fetch('https://<site>/api/rapidraw/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiKey, title, eventDate, images: [{ data: base64, width, height }] }),
})
```

> Za najbolje responzivne rezultate, rapidraw može slati više veličina kroz `variants` (npr. 320/640/1024/1600). Ako pošalje samo jednu, sustav je koristi kao jedinu varijantu.

Zdravstvena provjera: `GET /api/rapidraw/health`.

---

## 🗂 Struktura

```
src/            → Worker (API + AI + R2/D1), Hono
  api/          → route moduli (auth, galleries, images, events, posts, pages, search, rapidraw, files)
  lib/          → auth, ai, r2, serialize, process, site, helpers
frontend/       → React + Vite aplikacija (javni portfolio + admin)
  src/pages/    → javne stranice
  src/admin/    → admin panel
migrations/     → D1 shema
public/         → izgrađeni frontend (generira se s `npm run build`)
```

---

## ✨ Što sve podržava

- ✅ Galerije s **AI opisom, tagovima, naslovnom slikom i SEO meta** podacima
- ✅ **Responzivne slike** (više veličina, WebP, `srcset`, lazy-load)
- ✅ **Lightbox** s tipkovnicom (← → Esc)
- ✅ **Kalendar događaja** (nadolazeći + prošli, po mjesecima)
- ✅ **Blog objave** s mini-markdown (`**bold**`, `*italic*`, linkovi, embed)
- ✅ **Stranice** (O meni, Kontakt…) koje se automatski dodaju u meni
- ✅ **Društvene mreže** u footeru + **embed wall** na početnoj
- ✅ **Pretraga** fotografija po opisu i tagovima
- ✅ **Tamna / svijetla tema**, prilagodljiva boja akcenta
- ✅ **Dvojezično** sučelje (HR / EN)
- ✅ SSR **og:meta** za dijeljenje (Instagram/TikTok/Facebook prikaz linka)
- ✅ **One-click deploy** za bilo kojeg fotografa

---

*Napravljeno za Cloudflare Workers, R2, D1 i Workers AI. Bez servera, bez egress troškova.*
