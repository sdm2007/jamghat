# jamGhat — local business directory MVP

Market Hub helps local customers discover nearby shops and services, compare listed prices, see opening hours, and contact businesses. Customers do not need accounts. Business owners can register and manage their listing, hours, stock, and prices. One administrator account is configured using environment variables.

## What this version does

- Uses **Supabase Postgres** as the persistent database; the app no longer uses SQLite.
- Has an administrator role and business-owner role. Admin credentials are created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on first startup.
- Makes new business listings public immediately. The admin can still hide a listing if it is spam or incorrect; no approval workflow is required for routine registration.
- Stores the login session in an HttpOnly cookie instead of browser local storage.
- Requires business owners to verify their email address through a time-limited email link before they can sign in. Administrator access is configured separately and is automatically marked verified.
- Calculates an indicative **Market price range** from matching product prices currently listed on the site. It uses normalized exact item names and only shows a numerical range after at least two listings exist. Otherwise it says there are not enough comparable listings yet. This is a website-derived comparison, not an official or independently verified market price.
- Starts with an empty real directory. Earlier sample shops and sample prices are not seeded, because they used fictional/example contact details and should not be published as real listings.

## 1. Create the Supabase database

1. Create a project at https://supabase.com/.
2. In Supabase, open **Project Settings → Database → Connection string**.
3. Copy the **URI** connection string. For hosted Node services, use the Supabase pooler connection string if recommended for your project/region. Replace the password placeholder with your database password; do not share it publicly.
4. In Supabase **SQL Editor**, run the complete contents of [`backend/supabase/schema.sql`](backend/supabase/schema.sql). This creates the required tables and indexes.
5. In **Project Settings → API Keys** (or the project's API settings), copy the project URL and the secret `service_role` key for server use. Set them as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` locally and in your hosting provider's secret environment variables. Do not expose this key in frontend code. The backend creates a public `business-photos` Storage bucket on startup; you can also create that bucket manually in **Storage** if preferred. Use this bucket only for public business photos.

The server also runs this schema on startup, so running it in the SQL Editor is optional; it is provided for visibility and manual setup. No demo businesses or demo prices are seeded.

## 2. Configure email verification

Business registration sends a verification link by SMTP. Configure an SMTP provider before registering any businesses. You can use a transactional email provider's SMTP credentials (for example, Resend SMTP) or a Gmail app password for local testing. Do not use your Supabase database password as the SMTP password.

In `backend/.env`, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `PUBLIC_APP_URL`. For local testing, `PUBLIC_APP_URL=http://localhost:5000`; for production it must be your public HTTPS URL. Typical submission settings use port `587` with `SMTP_SECURE=false`, or port `465` with `SMTP_SECURE=true`; follow your email provider's instructions. `EMAIL_FROM` must be an address/name your provider permits.

Example format (replace every placeholder):

```dotenv
SMTP_HOST=smtp.your-provider.example
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=Market Hub <verified-sender@your-domain.example>
PUBLIC_APP_URL=http://localhost:5000
```

The server sends a unique verification link that expires after 24 hours. Only a hash of the token is stored in Postgres. If a user tries to sign in before verifying, login is blocked and the form offers to resend the email.

## 3. Run locally on Windows

Install Node.js 20 or newer. In PowerShell, from the extracted project folder:

```powershell
Copy-Item backend/.env.example backend/.env
# Edit backend/.env and set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, and the SMTP values above
npm install
npm run build
npm start
```

The website is served at `http://localhost:5000`. For frontend hot reload during development, open a second terminal:

```powershell
Copy-Item frontend/.env.example frontend/.env
npm --prefix frontend install
npm --prefix frontend run dev
```

The Vite development server uses `http://localhost:5000/api` for API requests. Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env` if you want the live Google Map; it is optional.

## 4. Deploy one service

A simple option is a Node web service on Render:

- **Root directory:** repository root (leave blank)
- **Build command:** `npm run build`
- **Start command:** `npm start`
- **Environment variables:** `NODE_ENV=production`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PGSSLMODE=require`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `PUBLIC_APP_URL` set to the deployed HTTPS URL; optionally `VITE_GOOGLE_MAPS_API_KEY` as a build-time frontend variable.
- Use a strong unique admin password of at least 12 characters. Do not commit `.env` files or expose database credentials in frontend variables.

The app serves frontend and API from the same origin, so no separate CORS origin is needed. If you host the frontend separately, set `CORS_ORIGIN` to its exact origin and set `VITE_API_BASE` to the backend API base URL. For cross-site cookie auth, deploy both over HTTPS and configure cookie/CORS settings to match the chosen domains.

## Important production notes

- **Photos:** all newly uploaded business photos are stored in Supabase Storage in the `business-photos` bucket. The backend creates this bucket at startup if needed, then saves each public image URL and its object path in the `business_photos` database table. The image files persist independently of Render restarts and redeploys. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SUPABASE_STORAGE_BUCKET` in the backend environment. The bucket is public so customers can view images; only the backend secret service-role key is used for uploads/deletes. Never put that key in a `VITE_` variable or commit it to Git. The existing upload interface is currently administrator-only.
- **Market price quality:** ranges only compare items whose names match after basic normalization. Different pack sizes, brands, models, or service scopes can be non-comparable even if their names look similar. Business owners should enter accurate item names, pack sizes, and prices. The range improves as more real shops list the same item.
- **Email verification:** when this updated schema is applied, existing non-admin users without an explicit verified state are marked unverified and must use the resend-verification flow before signing in. The admin account is marked verified at startup.
- **Empty directory:** the project does not seed demo businesses, fake prices, or demo photo records. It will show empty-state messages until real businesses and prices are registered. If you already inserted test rows into an existing Supabase database, remove only those test rows manually after identifying them; do not blindly clear production tables.
- **Location and Maps:** location permission is optional. Restrict the Google Maps browser key to your deployed domains and only the APIs you use.
- **Database access:** this server uses the Supabase Postgres connection string on the server, not the Supabase service key in browser code. Never put `DATABASE_URL`, a service-role key, or any secret in a `VITE_` variable.
- Back up your Supabase database and review the privacy policy/consent required for business contact information before public launch.
