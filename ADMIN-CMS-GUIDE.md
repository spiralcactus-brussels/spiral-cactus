# SpiralCactus — Pages CMS Administration

## One-time connection
1. Open https://app.pagescms.org/ and sign in with the GitHub account that controls spiralcactus-brussels/spiral-cactus.
2. Install/authorize the Pages CMS GitHub App. Choose 'Only select repositories' and select spiralcactus-brussels/spiral-cactus. Review the permissions before approval.
3. Select the repository and the main branch. Pages CMS reads the .pages.yml file already committed at the root. Do not create a second configuration.
4. The dashboard will show editors for Events & Lineups, Gallery, Blog, Spiral Radio, and Shop. Upload image files through the named media libraries.

## Working with the editors
- Events and Calendar: Add an item in Events, enter a unique ID, date, times, venue, names/descriptions in EN/FR/NL, ticket link, optional embedded shop link, poster and guest artists. Save. The event/calendar pages read content/events.json.
- Artists: DJ names, genres, crews and portraits are currently edited in each event's DJ Lineup field. The Community page still features the original two event IDs only.
- Gallery: Add a photo item. Upload or select a picture, then enter the Album ID used in that event. Save. Only photos listed in Gallery entries appear publicly. Uploading into the media library by itself is not enough.
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
