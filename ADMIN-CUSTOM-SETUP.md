# SpiralCactus — Custom Administration (Phase 1)
**Status: dashboard code committed; Supabase / Cloudinary connection and a real end-to-end test are still required.**

This is a separate, future replacement for Pages CMS, not a duplicate of the public website. The public SpiralCactus site remains on GitHub Pages. Pages CMS continues to be available while the new system is connected and tested.

- Future admin URL: https://spiralcactus-brussels.github.io/spiral-cactus/admin/
- Public gallery: https://spiralcactus-brussels.github.io/spiral-cactus/gallery.html
- Gallery backend: Supabase Authentication + PostgreSQL (protected by row-level security)
- Photo storage: Cloudinary signed uploads (secret stays in a Supabase Edge Function)
- Site configuration: `site-config.js` — **public client credentials only**
- Initial implementation: reliable batch photograph uploads, progress, draft/publish controls, and album management.
- Other dashboard sections (Events, Artists, Spiral Radio, Blog, Shop) show "SOON" intentionally. They are **not** connected in this phase; continue using Pages CMS for them until migrated.

## 1. Connect Supabase

You can connect the Supabase app in ChatGPT to let the assistant help create the database tables and deploy the Edge Function in your own account. Authorize the connection yourself. No passwords or private API keys need to be pasted into ChatGPT.

Alternatively, to set it up manually:

1. Create a free Supabase project at https://supabase.com/dashboard .
2. Go to **SQL Editor**, open `supabase/migrations/20261015_spiralcactus_gallery.sql` from this repository, and run it in your new project.
3. In **Authentication → Users**, invite/add an administrator user account that you control. Keep public email/password signup disabled; don't use a shared team password.
4. Find the user's UUID in Authentication → Users. In Supabase SQL Editor run:
   ```sql
   insert into public.sc_admins(user_id,role)
   values ('PASTE-YOUR-USER-UUID-HERE'::uuid,'owner')
   on conflict (user_id) do update set role=excluded.role;
   ```
   Each future team member can get their own invited account and an `editor` row in `sc_admins`.

**Security**: The photo table's row-level security policies allow the public site to read ONLY published photos. Only accounts present in `sc_admins` can see drafts, upload photo records, change publication status, or request Cloudinary upload signatures.

## 2. Connect Cloudinary safely

1. Create or sign into a Cloudinary account: https://console.cloudinary.com/ .
2. Find your **cloud name**, **API key**, and **API secret** in Cloudinary's console. **Do not put the API secret into GitHub, site-config.js, an issue, or a ChatGPT message.**
3. In your Supabase project, add these **Edge Function secrets** (via Supabase Dashboard or CLI):
   - `CLOUDINARY_CLOUD_NAME` (Cloudinary cloud name)
   - `CLOUDINARY_API_KEY` (Cloudinary API key)
   - `CLOUDINARY_API_SECRET` (Cloudinary API secret — confidential)
4. Deploy the Edge Function `supabase/functions/sc-cloudinary-sign/index.ts` with JWT verification enabled (the default). Using Supabase CLI from this repository:
   ```bash
   supabase login
   supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
   supabase functions deploy sc-cloudinary-sign
   ```
5. The function also needs the standard Supabase project environment variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`), normally supplied automatically in Supabase Edge Functions.

The Edge Function verifies the signed-in user and membership in `sc_admins` **before** signing a Cloudinary upload. Browser clients never receive Cloudinary's API secret.

**Important:** Do not use an unrestricted *unsigned* Cloudinary preset here. It would allow outsiders who discover its preset to upload files to your Cloudinary account. Signed uploads avoid that flaw.

## 3. Configure the website (public keys only)

In the GitHub repository edit `site-config.js`, replacing its empty strings:

```js
window.SC_BACKEND = Object.freeze({
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY"
});
```

Find these values in Supabase **Project Settings → API Keys / Data API**. A publishable/anon client key is designed to be included in frontend code; this is **not** the service-role/secret key. NEVER paste a `service_role`, `sb_secret_...`, or Cloudinary API secret into this file.

After the GitHub Pages deployment completes, open the /admin/ URL above. Sign in using the Supabase Authentication account you invited and whitelisted in `sc_admins`.

## 4. Bulk photo workflow

1. Choose the album from the event dropdown (the dashboard reads existing event names and gallery IDs from `content/events.json`).
2. Click or drag photographs into **Drag photos here**. Select dozens at once from Finder. JPEG, PNG, WebP and AVIF are supported when the browser can decode them.
3. Click **Upload Selected Photos**. The app converts large images to optimized JPGs, max 2,400 pixels on the longest side. It uploads up to three simultaneously, with per-file progress and error reporting.
4. Successfully uploaded photographs are saved in Supabase as **private drafts**; the live site does not display them yet.
5. Click **Publish Uploaded Batch** once. The public Gallery reads these published records via Supabase and shows them alongside the old GitHub gallery photos.
6. Use **Unpublish** on an existing photo to hide it from the public Gallery without deleting the image. If an upload succeeds in Cloudinary but saving the Supabase record fails, a Cloudinary orphan can remain; contact the maintainer before retrying many failed uploads.
7. Reload Gallery after a few seconds. Supabase-hosted published photos do **not** require a GitHub commit for each upload.

**Currently:** newly uploaded photos are managed in Supabase + Cloudinary, while the old Pages CMS gallery stays in GitHub JSON. The public Gallery merges both sources. The new administration only lists the photos in Supabase, not old GitHub JSON items — those must still be edited in Pages CMS during transition.

## 5. First end-to-end test checklist

- [ ] Login rejects unauthorized users.
- [ ] Authorized user can log in.
- [ ] Album dropdown shows August 28 and Acid Edition.
- [ ] Select ten JPEG photos in one operation.
- [ ] Watch each photo's upload progress.
- [ ] No failed photos (if there are, keep their filenames and error messages).
- [ ] Confirm new photos say PRIVATE DRAFT in Admin but do NOT appear in public Gallery.
- [ ] Click Publish Uploaded Batch once.
- [ ] Confirm the photos appear on public Gallery.
- [ ] Unpublish one photo and verify it disappears.
- [ ] Inspect on mobile (layout should remain usable).

Do not migrate the remaining sections or retire Pages CMS until this checklist passes. The absence of connected Supabase/Cloudinary credentials means the new admin currently displays the one-time setup state instead of a working sign-in page.

## Technical/security notes

- Free plans have quotas and can change; large libraries or heavy traffic may need paid capacity eventually.
- Photos are optimized locally but original camera files remain on the uploader's device.
- Direct media uploads are signed server-side. The signature expires; the app requests it per batch.
- The /admin/ HTML file itself is publicly retrievable on GitHub Pages. **The content and actions are secured by Supabase authentication, RLS and the signing function**, not by hiding the URL.
- Never rely on the admin UI for authorization; all writes must be denied by RLS for non-members.
- The gallery should still display its original JSON-based photos even when Supabase is not configured, offline or down.
- Third-party SoundCloud, WeTicket, gallery or contact arrangements are unchanged by this phase.

Official docs:
- Supabase security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Functions: https://supabase.com/docs/guides/functions/auth
- Cloudinary signed uploads: https://cloudinary.com/documentation/upload_images
