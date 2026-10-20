# Minnie Design

Online shop for Minnie Design, Port Said: business cards, magazines, notebooks and
coloring books, plus custom design requests.

- **Shop:** browse and filter, personalize business cards with a live preview, cart,
  checkout with cash on delivery, InstaPay or Vodafone Cash (with transfer
  screenshot), order tracking, accounts with order history.
- **Dashboard (`/admin`):** orders with payment review and history, custom requests
  with quotes, products and photos, categories, delivery areas, payment details and
  the admin team.

Built with Next.js 16, Supabase and Tailwind CSS, hosted on Vercel.

- To put it online, follow [DEPLOYMENT.md](DEPLOYMENT.md).
- For how it's protected and the pen test results, see [SECURITY.md](SECURITY.md).

## Run it locally

Needs Node 20+ and Docker.

```bash
npm install
npx supabase start          # local database, applies supabase/migrations
npx supabase status -o env  # copy the URL and keys into .env.local
npm run dev
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

To make a local account an admin:

```bash
docker exec -i supabase_db_minnie-design psql -U postgres -c \
  "insert into public.admins select id from auth.users where email = 'you@example.com';"
```

After changing the database schema, regenerate types with
`npx supabase gen types typescript --local --schema public > src/lib/database.types.ts`.
