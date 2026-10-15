# SPIRALCACTUS — YOUR FREE ADMIN DASHBOARD

Go to https://app.pagescms.org/ and select `spiralcactus-brussels/spiral-cactus` (main branch).

## CONTENT — Edit the site
- **01 — EVENTS & CALENDAR:** Dates, names in EN/FR/NL, posters, lineups and ticket links. Click an event or add a new one and Save.
- **02 — BLOG & NEWS:** Draft and publish articles; use the Published switch.
- **03 — SPIRAL RADIO:** Add SoundCloud mixes and playlists.
- **04 — SHOP & PRODUCTS:** Product images and checkout links.

Artists remain editable inside the event's DJ Lineup. There's no duplicate artist database.

## MEDIA — Upload photos and images
- **01 — GALLERY: RAVE NIGHT 28 AUG:** Upload party photographs from 28 August 2026 here.
- **02 — GALLERY: ACID EDITION 16 OCT:** Upload party photographs from 16 October 2026 here.
- **03 — EVENT POSTERS:** Posters used by the Events editor.
- **04 — DJ PORTRAITS:** Portraits used by the Events editor.
- **05 — BLOG IMAGES:** Covers used by Blog & News.
- **06 — SHOP PRODUCT IMAGES:** Merchandise photos.

### Upload photos (only the MEDIA area)
1. Open the correct gallery album under **MEDIA**.
2. Click **Upload** in that folder, or drag photographs into the media uploader if offered.
3. In Finder, select multiple optimized JPG or WebP photographs in one selection.
4. Wait for **every file** to show in the media list. This is the whole publishing action: no JSON edits, no secondary album editor, no extra Save.
5. After a successful GitHub Pages deployment, see the photos in https://spiralcactus-brussels.github.io/spiral-cactus/gallery.html (choose the album filter).

The public Gallery automatically discovers files stored in an event's folder on every GitHub Pages Jekyll build. It produces `content/gallery-auto.json` from `site.static_files`. Older individual captions in `content/gallery.json` and previous batch data in `content/gallery-albums.json` are preserved but removed from the Pages CMS sidebar. The unassigned file `assets/gallery/DSC_0030.JPG` is retained, not automatically associated with any event.

### If only one photo uploads
Pages CMS runs the actual upload process. Configuration cannot fix a service/browser upload failure. Test first with **three small JPGs** (each below 2 MB); make sure all 3 appear under Media and then in your live Gallery. If they don't, send a screenshot of the upload state and errors. For large camera files, first resize to around 2000–2400 pixels on the longest edge. Some users report Pages CMS refusing files over approximately 4.5 MB. Never assume the entire selected batch was uploaded if only one file appears.

### Future events
Future events should use an album folder named exactly after the event's Gallery album ID. The Jekyll manifest includes any new folder, but its named media link needs to be added to `.pages.yml` to make uploading into that folder one-click.

## Cost and deployment
Pages CMS and GitHub Pages are free for this public repository, subject to platform limits (including GitHub Pages site size and Pages CMS upload limits). No backend server, paid subscription, Supabase or Cloudinary needed. The unfinished custom admin prototype was retired. GitHub Pages still hosts the public site.

### Verification
Confirm the GitHub Pages deployment succeeds, then test an actual multi-image upload while signed in to Pages CMS. The assistant cannot simulate your signed-in Pages CMS account. If its bulk upload still fails with small files, we will need another free way to handle large batches rather than pretend it is fixed.
