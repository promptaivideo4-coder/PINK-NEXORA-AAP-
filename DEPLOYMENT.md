# Deploy Nexora to Vercel with Supabase Auth

## 1. Create the database
1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql).
3. In **Authentication → URL Configuration**, set **Site URL** to your production Vercel URL, for example `https://your-app.vercel.app`.
4. Add these **Redirect URLs**:
   - `https://your-app.vercel.app/#/app/owner/reset-password`
   - `http://localhost:3000/#/app/owner/reset-password` (local development)
5. In **Project Settings → API**, copy the **Project URL** and the **anon/public (or publishable) key**. Never expose the service-role key in the frontend.

## 2. Deploy
1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import this repository.
3. Add these environment variables for **Production**, **Preview**, and **Development**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional; required only for the AI API features)
4. Deploy. Re-deploy whenever a `VITE_` variable changes because Vite embeds these at build time.

## 3. Authentication behaviour
- **Request Access** creates the Supabase Auth user and a `salon_profiles` database row through the supplied trigger.
- If email confirmation is enabled in Supabase, the app tells the owner to verify their email before login.
- Successful login redirects to the **Dashboard**.
- Logout uses `supabase.auth.signOut()` and redirects to the welcome screen.

## Local run
Create `.env.local` from `.env.example`, set the two `VITE_SUPABASE_*` values, then run `npm run dev`.
