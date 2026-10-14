SPIRALCACTUS V4.1 — GITHUB PAGES (EN / FR / NL)

DEPLOY:
1. Unzip the archive.
2. Upload all files and directories into the ROOT of the existing GitHub repo, overwriting the older V3 files.
3. In GitHub: Settings > Pages > Build and deployment > Source: Deploy from a branch > Branch: main > /(root).
4. No Jekyll processing is required for the gallery. The website displays no raw template code.
5. Changes usually go live after GitHub Pages finishes deploying.

PHOTO GALLERY — EASY TO UPDATE THROUGH GITHUB (NO HTML EDITING):
- Gallery is deliberately empty. There is no temporary photo, code text or fake content.
- 1. In GitHub, upload your picture (.jpg/.png/.webp) to assets/gallery/<your-event-folder>/ using Add file > Upload files.
- 2. In GitHub, edit content/gallery.json and add an entry with the file path, album name and (optionally) a caption, in the format shown in content/EXAMPLES.md.
- 3. Save/commit. The photo appears once GitHub Pages redeploys, without rewriting the website or asking ChatGPT.
- Pictures are NOT listed automatically just by being uploaded: static GitHub Pages cannot reliably list folder contents without Jekyll/API or an index. The JSON entry is required.
- The existing albums are 2026-08-28-brussels-rave-night and 2026-10-16-acid-edition, linked from Events/Archives. More albums can be added as needed.
- Ensure you have publishing permission from photographers and include a credit when appropriate.

COMMUNITY ARTIST PHOTOS:
- Upload images (for example assets/artists/soul3d.jpg) via GitHub (create assets/artists/ if necessary).
- In content/events.json, find the artist under the relevant event and add "image": "assets/artists/soul3d.jpg" to the artist object.
- The community page reads this automatically; cards without image are unchanged.

OFFICIAL ACID EDITION POSTER:
- V3 archive did not contain the real poster. A custom typographic lineup poster is already in the Events section as a fallback.
- Upload your actual poster as assets/posters/acid-edition.jpg and in content/events.json change the "poster" field of acid-edition from "" to "assets/posters/acid-edition.jpg".

HK MODULAR FONT:
- HK Modular is a commercial font; NO commercial font files are bundled.
- Get an appropriate WEBFONT LICENSE from Hanken Design Co / MyFonts. Place licensed HKModular-Bold.woff2 in assets/fonts/.
- CSS will then use it for the homepage SPIRAL CACTUS title and the header wordmark. Until then the site uses Oxanium as the fallback.

EVENTS & CALENDAR:
- Edit content/events.json directly in GitHub and commit. Each event has multilingual name/description, date YYYY-MM-DD, start/end times, venue, artists, optional ticket/poster and gallery album folder.
- The Events page and monthly calendar read the same file automatically.
- Change venue/dates/ticket links in the JSON, not HTML. Do not add fake events.

BLOG:
- Edit content/blog.json, currently an empty JSON array []. Add posts using the format in content/EXAMPLES.md.
- Each post can include a unique slug, title, excerpt, body in en/fr/nl and an optional external url. Click a blog card to open its full article. Avoid publishing unfinished items with "published": false.

SHOP (READY TO CONFIGURE; CURRENTLY EMPTY):
- The Shop remains empty until you publish real products with valid hosted checkout links.
- Upload product pictures to assets/shop/ (the folder already exists).
- Edit content/shop.json in GitHub. Example:
  [
    {
      "name": {"en":"SpiralCactus T-shirt","fr":"T-shirt SpiralCactus","nl":"SpiralCactus T-shirt"},
      "description": {"en":"Black cotton shirt","fr":"T-shirt noir en coton","nl":"Zwart katoenen shirt"},
      "price": "€25.00",
      "image": "assets/shop/tshirt.jpg",
      "checkout": "https://buy.stripe.com/YOUR-ACTUAL-VERIFIED-LINK",
      "published": true
    }
  ]
- The example above is documentation only; do not publish it as a real product.
- Use genuine payment links from a verified Stripe/Mollie/WeTicket merchant account. Never copy API secret keys, credit card data or customer details into this public GitHub repository.
- The buyer completes payment on the hosted checkout, not on a GitHub Pages server.
- Organiser registration, VAT assessment, prices, refunds, shipping, consumer information and privacy policy need to be finalized before collecting real orders.

EMBEDDED EVENT TICKETING:
- Existing external WeTicket links remain available from the Events page.
- For a future event, set its "ticketEmbed" in content/events.json to the exact hosted WeTicket shop URL found via the WeTicket dashboard's Share button (format: https://your-org.weticket.io/your-event/shop).
- When valid and when the event is upcoming, an expand/collapse ticket panel on the Events page will embed the shop, with an external fallback.
- The Acid Edition embed currently uses the /shop path based on WeTicket documentation; VERIFY it on the live website before directing paying customers to it.
- GitHub Pages itself never accepts card numbers, creates ticket barcodes, reconciles purchases or sends payout statements; WeTicket handles transactions and ticket issuance.

MEDIA UPLOADS:
- Go INSIDE the target folder in GitHub before clicking Add file > Upload files. Upload IMAGE FILES, NOT a whole parent folder (to avoid nested incorrect paths).
- Actual event posters: assets/posters/ and update the matching "poster" in content/events.json.
- Community artist pictures: assets/artists/ and update the matching artist's "image" in content/events.json.
- Gallery photos can go straight into assets/gallery/; then add each image's relative path and album ID to content/gallery.json. Keep gallery data [] until photos exist.
- For August 28 album use 2026-08-28-brussels-rave-night. For October 16 use 2026-10-16-acid-edition.


TRANSLATIONS:
- i18n.js contains all standard website text in EN, FR and NL. Content JSON includes language versions of events/blog entries.
- Change UI translations in i18n.js, and editorial event/blog content in the JSON files.
- The language selector keeps the selected language when changing pages. No external translation API is required.

CONTACT:
- The contact form now submits via AJAX to https://formsubmit.co/ajax/spiralcactus24@gmail.com; the HTML action at https://formsubmit.co/spiralcactus24@gmail.com is a fallback for visitors without JavaScript.
- No FormSubmit login or secret key is needed. On the FIRST genuine submission, FormSubmit sends an activation email to spiralcactus24@gmail.com. The mailbox owner MUST confirm it before emailed submissions are delivered. Check Spam as well.
- IMPORTANT: Do not tell users that inbox delivery has been verified until you complete a real form submission and confirm receipt in the SpiralCactus mailbox. A successful API response proves submission acceptance, not necessarily inbox delivery.
- The form shows EN/FR/NL status messages, includes a honeypot, leaves FormSubmit's default CAPTCHA protection enabled, and informs visitors that the third party processes their data. FormSubmit's published documentation describes keeping submissions for 30 days.
- To test, open the public contact page, complete all fields with a unique subject, submit, activate the mailbox as instructed, then submit again and inspect the recipient Inbox and Spam folder. JavaScript off uses the third-party fallback form (may navigate away from the site).
- Public contact is spiralcactus24@gmail.com, set in app.js.

LOCAL PREVIEW:
- The photo gallery is rendered from content/gallery.json using JavaScript. View locally with a local HTTP server, not file://.
- Other dynamic pages fetch JSON: test using a local HTTP server (e.g. python3 -m http.server 8000) rather than opening with file://.


SPIRAL RADIO (FREE SOUNDCLOUD EMBEDS):
- radio.html is the dedicated guest-music page. It links from every site navigation menu.
- content/radio.json holds the selected SoundCloud tracks/sets. Valid source URLs must be https://soundcloud.com/... (or www/m.soundcloud.com). Each entry has id, artist, title, genre, description, format ('track' or 'playlist') and url.
- Entries must correspond to genuine SpiralCactus event guests. The initial selection features Soul3d and Minopolska. Please obtain artist approval where appropriate; SoundCloud embed permission and third-party rights remain relevant.
- An official SoundCloud iframe plays tracks; no MP3/WAV files are copied or rehosted. Clicking Start Listening is required, including for privacy and browser autoplay policies.
- SoundCloud itself controls internal transitions in a multi-track playlist. When an individual track ends, radio.js tries to start the next selection. Browser autoplay protections may require a second press on the SoundCloud play control. Closing the page or navigating to another page will stop the stream.
- To add future guest DJs, first ensure the artist is listed in a genuine SpiralCactus event's artists array in content/events.json. Then add the artist's public SoundCloud track/playlist to content/radio.json. The Radio filter automatically discovers the available DJs. Do not claim this is a live broadcast.
- Music licensing: a DJ's permission alone does not necessarily clear the copyrights in underlying tracks. Prefer official artist-enabled SoundCloud embeds. Assess Belgian public streaming rights before promoting the feature as an always-on radio station.
