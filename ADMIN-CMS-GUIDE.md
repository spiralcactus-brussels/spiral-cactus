# SpiralCactus — Pages CMS Administration

## One-time connection
1. Open https://app.pagescms.org/ and sign in with the GitHub account that controls spiralcactus-brussels/spiral-cactus.
2. Install/authorize the Pages CMS GitHub App. Choose 'Only select repositories' and select spiralcactus-brussels/spiral-cactus. Review the permissions before approval.
3. Select the repository and the main branch. Pages CMS reads the .pages.yml file already committed at the root. Do not create a second configuration.
4. The dashboard will show editors for Events, BULK PHOTO UPLOAD, optional individual photo captions, Blog, Spiral Radio, and Shop. Upload image files through the named media libraries.

## Working with the editors
- Events and Calendar: Add an item in Events, enter a unique ID, date, times, venue, names/descriptions in EN/FR/NL, ticket link, optional embedded shop link, poster and guest artists. Save. The event/calendar pages read content/events.json.
- Artists: DJ names, genres, crews and portraits are currently edited in each event's DJ Lineup field. The Community page still features the original two event IDs only.
- **Bulk Gallery (recommended):** Click **BULK PHOTO UPLOAD — Event Albums** in Content, expand the relevant event (Item #1 = August 28; Item #2 = Acid Edition), and open its Photos picker. Click Upload and select 20 or more JPG/WebP/PNG pictures at once (Cmd/Ctrl-click or Shift-click in the file picker, or drag and drop). Save once. The public Gallery automatically displays every selected picture in that album. If the picker already contains photos, ADD new photos; do not replace or delete the existing selection unless intended.
- **New album:** Create a new item in Bulk Photo Upload. Enter a friendly name and copy its Gallery album ID exactly from the event in Events & Calendar. Choose the pictures, Save. This requires no code edits.
- **Optional custom captions:** The **Individual photo captions (optional)** section continues to manage one picture at a time with translations. If an image is present in both lists, the custom-caption entry wins and the photo is not duplicated.
- **Media library:** The **Event photography** tab can upload multiple files too, but uploading only to the media library does NOT register images on the public website. Select the photographs into the bulk album and Save. The photos do not have to reside in separate physical folders: they are grouped by album ID.
- **Upload size:** Very large camera JPGs can exceed Pages CMS/GitHub upload limits. Resize/compress large files first; for website use, roughly 2000–2560 px along the longest edge and 300 KB–2 MB per image is usually adequate.
- Blog: Add a post with date, unique lowercase hyphenated slug, EN/FR/NL title, excerpt and body. Optionally upload a cover picture. Keep Published off until ready. The public blog supports plain text and blank-line paragraphs, not full rich text formatting.
- Spiral Radio: Enter a unique mix ID, a DJ name matching an existing event lineup, title and public SoundCloud link. Select track or playlist. Save. The player reads content/radio.json.
- Shop: Fill in product content and image. Set Published on and a valid payment-provider checkout link for the product to appear. The CMS does not provide a payment processor.

## Publishing and security
- Saving in Pages CMS commits to GitHub, then GitHub Pages deploys the public site automatically. Your public design and URL remain unchanged.
- Pages CMS is a separate private administration app secured by GitHub authentication. Do not share any passwords, personal access tokens or GitHub private keys.
- Existing content remains stored as JSON arrays. The editor lets you add list items; there is no need to write JSON by hand.
- Avoid editing the same JSON file simultaneously in GitHub and Pages CMS. Keep backups before bulk edits.
- Verify the first write by adding a draft blog post; confirm the underlying JSON remains an array before editing live event data.
- Big photos should be optimized before upload. Large files may hit GitHub/Pages CMS provider limits.
- The Pages CMS login and live editing session cannot be tested here until the owner authorizes the app in their browser.

Official documentation: https://pagescms.org/docs/quick-start/
