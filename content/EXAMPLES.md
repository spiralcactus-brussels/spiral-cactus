# NEW: BULK GALLERY UPLOAD WITH PAGES CMS

Open https://app.pagescms.org/ → spiral-cactus → **BULK PHOTO UPLOAD — Event Albums**.
Select the August 28 or Acid Edition album, then in its **PHOTOS** image picker choose multiple images at once. **Save once**. There is no need to add one JSON entry per image.
For future events, create a new album item with the event's gallery ID. The album lists are stored in `content/gallery-albums.json` and the public gallery merges them with the optional individually captioned images in `content/gallery.json`. Duplicate image URLs are shown only once, preferring the captioned entry.

---
# Editing SpiralCactus data through GitHub

## New event

Edit `content/events.json`. Each event is an object in the `[` `]` array separated by commas. Example:

```json
{
  "id": "new-night-2026-11-20",
  "date": "2026-11-20",
  "start": "22:00",
  "end": "06:00",
  "venue": "Venue to be announced",
  "gallery": "2026-11-20-new-night",
  "ticket": "",
  "poster": "",
  "name": {"en": "New Night", "fr": "Nouvelle soirée", "nl": "Nieuwe avond"},
  "description": {"en": "Description in English", "fr": "Description en français", "nl": "Beschrijving in het Nederlands"},
  "artists": [{"name": "DJ Example", "genre": "Electronic"}]
}
```

After the event, upload photos to a subfolder of `assets/gallery/` or directly inside `assets/gallery/`, then register the paths in `content/gallery.json`. The album filter will read album IDs from the event file and photo entries; do not edit `gallery.html`.

## New blog post

Replace `[]` in `content/blog.json` with:

```json
[
  {
    "date": "2026-11-20",
    "slug": "our-next-chapter",
    "published": true,
    "title": {"en": "Our next chapter", "fr": "Notre prochain chapitre", "nl": "Ons volgende hoofdstuk"},
    "excerpt": {"en": "A short intro", "fr": "Une courte introduction", "nl": "Een korte intro"},
    "body": {"en": "Full text", "fr": "Texte complet", "nl": "Volledige tekst"},
    "url": ""
  }
]
```

The blog card displays the excerpt; clicking Read More opens the full `body` text inside `blog.html?post=your-slug`. Separate paragraphs in the JSON body with `\n\n`. You can optionally link to an external article with `url`.

## Gallery upload procedure

1. Open the **actual destination folder** on GitHub, e.g. `assets/gallery/`. Choose **Add file** > **Upload files** and select the JPG/PNG/WebP files themselves (not a containing parent folder). Commit.
2. Edit `content/gallery.json` and add an entry for each uploaded photo with its exact file path and album ID (example below). Commit.
3. Refresh the live site after GitHub Pages redeploys. **Both upload and JSON entry are necessary.** You do **not** need to change HTML or JavaScript.

For event posters, upload to `assets/posters/` and set `poster` in `content/events.json` to the uploaded file path. For Community artist images, upload to `assets/artists/` and set `image` on that artist in `content/events.json`.


## Photo gallery (`content/gallery.json`)

The file starts with `[]`. Add one object per photo. The images are stored in GitHub at the matching path:

```json
[
  {
    "file": "assets/gallery/2026-08-28-brussels-rave-night/party-01.jpg",
    "album": "2026-08-28-brussels-rave-night",
    "caption": {
      "en": "Brussels Rave Night — Photo by Photographer Name",
      "fr": "Brussels Rave Night — Photo de Photographer Name",
      "nl": "Brussels Rave Night — Foto door Photographer Name"
    }
  }
]
```

This is only an example; **no photo is published in the gallery by default.** When adding another picture, separate entries with a comma and keep valid JSON syntax.

## Artist pictures in Community (`content/events.json`)

Inside an event's `artists` list you can add an optional image property without changing the HTML:

```json
{
  "name": "Soul3d",
  "crew": "Oldschool Waves · Gazmatek · Exiles",
  "image": "assets/artists/soul3d.jpg"
}
```

First upload the image into the corresponding GitHub folder. The old text-only design stays unchanged for artists without an image.

## Verified August 28 lineup

The event was billed as Jungle, Drum & Bass, Neo Tekno, Hardcore Gabber and Hard Core.
The original poster identifies artist crews/labels but does NOT say which exact genre each artist played. Accordingly the artist cards show the poster's verified crew credit where no reliable per-artist genre was provided. When confirmed, add an artist-specific `"genre": "Exact set style"` in `content/events.json`; that will replace the crew label for that card. The name is `Obvyss`.

## Contact form

GitHub Pages hosts static HTML and cannot itself send email. The current Contact form opens a draft in the visitor's mail app addressed to `spiralcactus24@gmail.com`. To have the Send button deliver immediately, connect a real third-party hosted form endpoint (such as Formspree) to an account you control, confirm its email address and test delivery. No endpoint is currently configured; don't mistake the mailto draft for confirmed delivery.
