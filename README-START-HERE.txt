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

SHOP:
- Intentionally blank. No dummy products, checkout, payments, or orders are enabled.

TRANSLATIONS:
- i18n.js contains all standard website text in EN, FR and NL. Content JSON includes language versions of events/blog entries.
- Change UI translations in i18n.js, and editorial event/blog content in the JSON files.
- The language selector keeps the selected language when changing pages. No external translation API is required.

CONTACT:
- Form opens user's email application; it does not transmit/save form data to a server.
- Public contact is spiralcactus24@gmail.com, set in app.js.

LOCAL PREVIEW:
- The photo gallery is rendered from content/gallery.json using JavaScript. View locally with a local HTTP server, not file://.
- Other dynamic pages fetch JSON: test using a local HTTP server (e.g. python3 -m http.server 8000) rather than opening with file://.
