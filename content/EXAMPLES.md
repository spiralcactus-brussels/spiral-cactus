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

Create `assets/gallery/2026-11-20-new-night/` and add photos there after the event. For a new album option in the dropdown, add the folder slug and label as a `<option value="2026-11-20-new-night">New Night</option>` to `gallery.html`; listing photos within the new folder itself is automatic.

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

GitHub website > repository > `assets` > `gallery` > choose event folder > **Add file** > **Upload files** > **Commit changes**. No HTML update needed for additional photos in existing folders. Uploads are published after the GitHub Pages/Jekyll build completes.


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
  "genre": "Acid / Hardcore",
  "image": "assets/artists/soul3d.jpg"
}
```

First upload the image into the corresponding GitHub folder. The old text-only design stays unchanged for artists without an image.
