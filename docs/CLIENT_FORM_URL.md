# Client public form URL (no login)

When you add a client, the app generates a **slug** from the client name (e.g. "Acme Corp" → `acme-corp`). Each client gets a public form URL:

- **Local:** `http://localhost:3000/{slug}/form`
- **Production:** `https://your-domain.com/{slug}/form`

This page is **public** (no login). Anyone with the link can open it and see the form. You can replace the placeholder form in `app/[slug]/form/page.tsx` with your own UI.

## Database

Add the `slug` column to `public.clients` if it doesn’t exist. In **Supabase → SQL Editor** run:

```sql
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS clients_slug_key ON public.clients(slug) WHERE slug IS NOT NULL;
```

New clients created via the app get a slug automatically. Existing rows may need a one-time backfill (e.g. set `slug` from `name`).

## Flow

1. **Add client** (admin, logged in) → API generates a unique `slug` and saves it.
2. **Share link** → e.g. `https://yourapp.com/acme-corp/form`.
3. **Visitor** opens the link (no login) → sees the form for that client. Replace the placeholder in `app/[slug]/form/page.tsx` with your form UI.

## Reserved slugs

Slugs that match app routes (`api`, `clients`, `login`, `confirmation`, etc.) are suffixed (e.g. `client` → `client-c`) so they don’t conflict with existing routes.
