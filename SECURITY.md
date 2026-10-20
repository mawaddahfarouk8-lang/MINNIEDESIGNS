# Security

## How the site is protected

| Risk | Protection |
| --- | --- |
| Someone changes prices in the browser | Prices, option extras and delivery fees are recalculated inside the database (`public.place_order`) from the catalog. The browser only sends product IDs, options and quantities. |
| Reading other people's orders or data | Row-level security on every table. Customers see only their own orders, profile and requests; visitors see only the active catalog. |
| Becoming admin | Admin membership lives in `public.admins`, which customers can't write. Every admin page and action checks it on the server, and the database checks it again. |
| Payment screenshots leaking | Stored in a private bucket. Admins see them through links that expire after 10 minutes. |
| Malicious uploads | Only JPG, PNG and WEBP, checked by their file contents (not the name), 4 MB maximum. SVG and HTML are refused. |
| Password guessing, spam orders, order-number guessing | Rate limits stored in the database, shared across all servers: sign-in (8 per 15 min per IP, 5 per account), sign-up, password reset, orders, order tracking and custom requests. Order tracking needs both the order number and the phone number. |
| Cross-site scripting | React escapes all text; strict Content-Security-Policy; no HTML from users is ever rendered. |
| Cross-site request forgery | Next.js server actions reject requests from other sites (Origin check). |
| Clickjacking, sniffing, downgrade | `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, HSTS. |
| Leaked keys | The secret key is used only in server-only modules and never reaches the browser bundle. `.env` files are git-ignored. |

## Penetration test — 21 Oct 2026

Run against a production build with a local copy of the database. All 48 checks passed.

**Database and storage, attacked directly with the public key (28 checks)**
- Anonymous visitors could not read orders, order items, history, profiles, admins
  or custom requests, and saw only active products.
- They could not insert orders directly, change prices or payment details, call the
  order or rate-limit functions, list payment screenshots or upload files.
- A signed-in customer could not see other orders, profiles or requests, make
  themselves admin (including by editing their own account metadata), mark orders
  paid, change prices or quotes, edit other profiles, list screenshots, upload
  product images, or call the order function directly.

**Website (20 checks)**
- Security headers present; no server version leak.
- Signed-out visitors are sent to sign-in from every admin URL.
- Open redirect through `?next=//evil.example` is blocked.
- Form posts from another site are rejected.
- HTML disguised as PNG and SVG uploads are rejected.
- A script payload saved through the custom request form is shown as plain text in the dashboard.
- Invalid input is rejected with field errors.
- Unknown orders get a generic message, so it doesn't reveal which order numbers exist.
- A customer cannot open the dashboard, the order list, or another customer's order page.
- Order tracking and password guessing hit their rate limits.

**Also checked**
- Supabase security advisors: no issues.
- `npm audit` on runtime dependencies: 0 vulnerabilities. Dev-only tooling (ESLint)
  has a known advisory in `braces`; it isn't part of the deployed site.
- Every admin server action calls `requireAdmin()` before doing anything.

## Known limits

- **Signing up reveals whether an email is registered** when email confirmation is
  off. Keep "Confirm email" on in Supabase (see DEPLOYMENT.md).
- **The CSP allows inline scripts.** Next.js needs this for prerendered pages. Every
  other source is locked down, and React escaping is the main XSS defense.
- **The first commit of this repository contains the old PHP admin password** in
  `config/admin_secret.php`. That password no longer protects anything, but don't
  reuse it anywhere. Making the repository private hides the history.
