SPIRALCACTUS — CURRENT WEBSITE GUIDE (15 OCTOBER 2026)
==================================================

PUBLIC WEBSITE
https://spiralcactus-brussels.github.io/spiral-cactus/

EDITING THE SITE — ONE FREE DASHBOARD
https://app.pagescms.org/
Connect using the authorized GitHub account and select
spiralcactus-brussels/spiral-cactus → main.

- CONTENT → Events & Calendar: venue, date, posters, ticket links and DJ lineups.
- CONTENT → Blog & News: multilingual drafts and published stories.
- CONTENT → Spiral Radio: official SoundCloud mixes.
- CONTENT → Shop & Products: entries require a real external checkout.
- MEDIA → Gallery: Rave Night 28 Aug: photo album for the first event.
- MEDIA → Gallery: Acid Edition 16 Oct: second event album.
- MEDIA → Event Posters, DJ Portraits, Blog Images, Shop Images as needed.

To add gallery photos: open the correct event in MEDIA, upload
optimized JPG/WebP photos, wait for all files to appear, then allow the
GitHub Pages deployment to complete. The website generates
content/gallery-auto.json during its Jekyll build to discover files in
assets/gallery/<event-album-id> automatically. No separate photo JSON
record is needed. An older legacy album and captioned photo schema is
retained for backwards compatibility. See ADMIN-CMS-GUIDE.md.

NOTE: Pages CMS has returned HTTP 413 when uploading large camera
originals. Prepare photos at ~2400px maximum and under 2MB per photo.
Check several small uploads before sending larger batches.

SITE STATUS & QUALITY
- The public site is a static GitHub Pages project with EN/FR/NL content.
- Latest full source audit can be run in GitHub Actions:
  .github/workflows/site-audit.yml / scripts/site_audit.py
- Official October 16 poster: assets/posters/The final poster .png
- August photo linked to that event:
  assets/gallery/2026-08-28-brussels-rave-night/img6420.jpeg
- Other loose photos in repository root or the gallery root are not
  automatically assigned to albums; ask the owner before categorizing.
- The home hero uses the original white still logo from
  assets/logo-original.jpg. There is no missing background video.
- HK Modular is not bundled; this commercial font needs its own
  suitable web license before upload. Fallback: Oxanium.

TICKETS & RADIO
- Tickets use the official WeTicket event page; the embedded /shop
  URL is configured but must be tested live by a site owner.
- Spiral Radio uses the SoundCloud widget; some recordings may be
  restricted by SoundCloud or browser autoplay policy.
- Do not assume that artist consent alone clears rights in every mix.

CONTACT FORM
- FormSubmit submits to spiralcactus24@gmail.com, but real inbox
  delivery is NOT verified. The owner must activate FormSubmit by email
  if prompted, then submit another test message and confirm receipt.

GOOGLE & DOMAINS
- Sitemap: /sitemap.xml covers all 11 main public pages.
- Open https://search.google.com/search-console/ and add the URL-prefix:
  https://spiralcactus-brussels.github.io/spiral-cactus/
- Verify ownership through an HTML tag or verification file, submit
  sitemap.xml, and request indexing of the homepage.
- Do not edit the domain or CNAME, absolute canonical links, OG URLs,
  sitemap, or FormSubmit source URL until the owner confirms the exact
  new custom domain and controls its DNS. Domain hosting via GitHub
  Pages can be free, but registering .com/.be is generally paid.
- Google decides if and when pages are indexed.

CONTENT THAT IS NOT YET FINAL
- Blog and Shop currently have no published records.
- Pages CMS multi-photo upload, WeTicket embedded purchase, FormSubmit
  delivery and real cross-device appearance need a live browser test.
