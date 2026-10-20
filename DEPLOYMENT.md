# Going live

The site runs on **Vercel** (the website) and **Supabase** (database, accounts and
uploaded images). Both have free plans that cover a shop this size.

Do these steps once, in order. Steps 1–4 take about 15 minutes.

## 1. Create the database from Vercel

1. Open the project on [vercel.com](https://vercel.com) → **Storage** → **Create Database** → **Supabase**.
2. Pick the region closest to Egypt (Frankfurt, `eu-central-1`) and create it.
3. Connect it to this project for **Production** and **Preview**.

Vercel adds the connection settings to the project's environment variables by
itself. They include a secret key, which stays on the server and never reaches the
browser.

## 2. Create the tables

1. In Vercel → Storage → your Supabase database → **Open in Supabase**.
2. Go to **SQL Editor** → **New query**.
3. Run each file in `supabase/migrations/` **in order**, one query at a time. Paste
   the whole file, then press **Run**:
   1. `20261020220000_init_schema.sql`
   2. `20261020224607_card_photos.sql`

This creates the tables and security rules, the storage folders for images, the
categories, and the three starting products.

## 3. Account settings in Supabase

In Supabase → **Authentication**:

- **URL Configuration** → Site URL: your site address (for example
  `https://minniedesign.vercel.app`). Add `https://YOUR-SITE/**` under Redirect URLs.
- **Sign In / Providers → Email**: keep "Confirm email" on. Set the minimum password
  length to 8 and require letters and digits.
- **Emails → SMTP**: Supabase's built-in email sends only a few emails per hour.
  Before launch, connect a free [Resend](https://resend.com) account so sign-up
  confirmations and password resets always arrive.

## 4. One environment variable

In Vercel → Settings → Environment Variables, add:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | your site address, e.g. `https://minniedesign.vercel.app` |

Then redeploy (Deployments → ⋯ → Redeploy).

## 5. Make yourself the admin

1. Open the live site → **Sign in** → **Create an account** with your email.
2. Confirm the email.
3. In Supabase → SQL Editor, run (with your email):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

4. Refresh the site. A **Dashboard** link appears in the header.

After this, you can add other admins from **Dashboard → Settings → Admins**.

## 6. Fill in your details

In **Dashboard → Settings**:

- InstaPay address and Vodafone Cash number. Each transfer option shows at checkout
  only after you fill it in.
- WhatsApp number and Instagram link.
- Delivery areas and fees.

Then check **Products**: replace the starting prices and photos with your real ones.

## Environment variables reference

| Name | Where it comes from | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase integration | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase integration | No (safe in the browser) |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Supabase integration | **Yes.** Never share it or put it in code |
| `NEXT_PUBLIC_SITE_URL` | You (step 4) | No |

Never commit a `.env` file. `.gitignore` already blocks them.
