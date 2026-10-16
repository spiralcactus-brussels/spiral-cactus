#!/usr/bin/env python3
"""SpiralCactus repository audit. Standard-library only; no secrets or network."""
from __future__ import annotations
import json, re, struct, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://spiralcactus-brussels.github.io/spiral-cactus/"
PAGES = ["index.html","discover.html","events.html",
         "calendar.html","gallery.html","radio.html","artists.html",
         "blog.html","shop.html","contact.html","members.html"]
errors = []
warnings = []
checks = []

def check(test, msg):
    (checks if test else errors).append(msg)

class AuditHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = 0
        self.ids = []
        self.refs = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "h1": self.h1 += 1
        if "id" in attrs: self.ids.append(attrs["id"])
        for key in ("href","src","action"):
            if key in attrs: self.refs.append((key,attrs[key]))

def dimensions(path: Path):
    # PNG and JPEG width/height from binary headers without image libraries.
    with path.open("rb") as f:
        if f.read(8) == b"\x89PNG\r\n\x1a\n":
            header = f.read(16)
            return ("PNG", *struct.unpack(">II",header[8:16]))
        f.seek(0)
        if f.read(2) != b"\xff\xd8": return ("unknown",0,0)
        while True:
            c=f.read(1)
            if not c: break
            if c!=b"\xff": continue
            marker=f.read(1)
            while marker==b"\xff": marker=f.read(1)
            if not marker or marker in (b"\xda",b"\xd9"): break
            if marker in [bytes([i]) for i in (0xd8,0x01,0xd0,0xd1,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7)]:continue
            length=f.read(2)
            if len(length)<2:break
            n=int.from_bytes(length,"big")
            if marker[0] in (0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca):
                block=f.read(5)
                return ("JPEG",int.from_bytes(block[3:5],"big"),int.from_bytes(block[1:3],"big"))
            f.seek(n-2,1)
    return ("JPEG",0,0)

for name in PAGES:
    content=(ROOT/name).read_text()
    parsed=AuditHTML();parsed.feed(content)
    check(parsed.h1==1, f"{name}: one H1")
    check(len(parsed.ids)==len(set(parsed.ids)),f"{name}: unique DOM IDs")
    match=re.search(r'<link rel="canonical" href="([^"]+)"',content)
    check(bool(match) and match.group(1)==BASE+("" if name=="index.html" else name), f"{name}: canonical URL")
    check('name="description"' in content,f"{name}: description")
    check('property="og:title"' in content,f"{name}: social sharing meta")
    check('noindex' not in content.lower(),f"{name}: indexable HTML")
    for attr,url in parsed.refs:
        if url.startswith(("#","mailto:","tel:","data:","https:","http:")):continue
        path=unquote(urlsplit(url).path)
        if path and not (ROOT/path).is_file():
            errors.append(f"{name}: broken {attr}={url}")

for js in ("app.js","radio.js","i18n.js","members.js","members-config.js"):
    result=subprocess.run(["node","--check",str(ROOT/js)],capture_output=True,text=True)
    check(result.returncode==0,f"{js}: syntax check")
    if result.returncode:errors.append(result.stderr[:1500])

events=json.loads((ROOT/"content/events.json").read_text())
radio=json.loads((ROOT/"content/radio.json").read_text())
gallery=json.loads((ROOT/"content/gallery.json").read_text())
oldalbums=json.loads((ROOT/"content/gallery-albums.json").read_text())
check(bool(events) and all(e.get("date") and e.get("id") and e.get("name") for e in events),"Events data valid")
for event in events:
    poster=event.get("poster","")
    if poster and not poster.startswith(("http://","https://")):
        check((ROOT/poster).is_file(),f"{event['id']}: poster file exists")
    check(bool(event.get("gallery")),f"{event['id']}: gallery ID")
check(all(str(r.get("url","")).startswith("https://soundcloud.com/") for r in radio),"Radio SoundCloud sources")
check(isinstance(gallery,list) and isinstance(oldalbums,list),"Gallery legacy files valid")
for group in oldalbums:
    for path in group.get("photos", []):
        check((ROOT/path).is_file(), f"Gallery album {group.get('album','?')}: linked photo exists ({path})")


# Legacy deep links should redirect to the merged Discover Us Experiences section.
legacy=(ROOT/"activities.html").read_text()
check('url=discover.html#experiences' in legacy, "Old Experiences URL forwards to Discover Us")
merged=(ROOT/"discover.html").read_text()
check('id="experiences"' in merged, "Experience section merged into Discover Us")
check(merged.count('<article class="card">') >= 9, "All project and experience cards retained")
check('id="today"' in merged and 'id="future"' in merged, "Discover Us: present and future clearly separated")
check(merged.index('id="philosophy"') < merged.index('id="future"') < merged.index('id="experiences"'), "Discover Us: philosophy before future and experiences")
check(merged.count('class="discover-value"') == 4, "Discover Us: four practical nightlife values")

for name in PAGES:
    page=(ROOT/name).read_text()
    check('href="activities.html"' not in page, f"{name}: no outdated Experiences navigation")
    check('>Discover Us</a>' in page, f"{name}: Discover Us label on menu")

sitemap=(ROOT/"sitemap.xml").read_text()
urls=re.findall(r"<loc>([^<]+)</loc>",sitemap)
check(len(urls)==len(PAGES) and set(urls)=={BASE+("" if p=="index.html" else p) for p in PAGES},"Sitemap includes all pages")

translationsJS=(ROOT/"i18n.js").read_text()
proc=subprocess.run(["node","-e", "const fs=require('fs'),vm=require('vm');const w={window:{}};vm.runInNewContext(fs.readFileSync('i18n.js','utf8'),w);console.log(JSON.stringify(w.window.SC_TRANSLATIONS));"],cwd=ROOT,capture_output=True,text=True)
if proc.returncode:
    errors.append("Translation parser error: "+proc.stderr[:1500])
else:
    translations=json.loads(proc.stdout)
    en=set(translations["en"])
    check(all(set(translations[l])==en for l in ("fr","nl")),"EN/FR/NL translation key coverage")
    for filename in PAGES:
        page=(ROOT/filename).read_text()
        keys=set(re.findall(r'data-i18n(?:-placeholder|-aria-label|-content|-title)?="([^"]+)"',page))
        check(not (keys-en),f"{filename}: all translation labels present")

assets=["assets/posters/The final poster .png","assets/logo-original.jpg","assets/gallery/DSC_0030.JPG"]
print("IMAGE INSPECTION")
for path in assets:
    f=ROOT/path
    if not f.exists():warnings.append(path+" missing");continue
    fmt,w,h=dimensions(f)
    print(f"  {path}: {fmt} {w}×{h}, {f.stat().st_size/1024/1024:.2f} MiB")
    if not w or not h:warnings.append(path+": unable to read image dimensions")
    if path.endswith("poster .png") and min(w,h)<1000:warnings.append("Official poster may be too low-resolution for large display")
    if "gallery" in path and f.stat().st_size>3_500_000:
        warnings.append("Gallery photo is a large camera original (>3.5 MB), compress for Pages CMS before using")

listed=[p for p in (ROOT/"assets/gallery").rglob("*") if p.suffix.lower() in (".jpg",".jpeg",".png",".webp",".avif")]
folders=[x for x in listed if x.parent.name in {e["gallery"] for e in events}]
print(f"Gallery: {len(gallery)} individually registered entries, {sum(len(x.get('photos',[])) for x in oldalbums)} legacy batch entries, {len(folders)} photos in known event folders, {len(listed)-len(folders)} unassigned")
if not folders and not gallery and not any(a.get("photos") for a in oldalbums):
    warnings.append("Live event photo gallery has no registered pictures")
if len(listed)>len(folders):
    warnings.append("Some gallery images lie outside named event folders and will not be auto-listed")
if (ROOT/"assets/spiral-stickers.mp4").exists():
    warnings.append("Unused animation file still present")
if "HKModular-Bold.woff2" in (ROOT/"style.css").read_text() and not (ROOT/"assets/fonts/HKModular-Bold.woff2").exists():
    warnings.append("Optional licensed HK Modular webfont is absent; fallback Oxanium is used")
if not json.loads((ROOT/"content/blog.json").read_text()):
    warnings.append("Blog has no published articles")
if not json.loads((ROOT/"content/shop.json").read_text()):
    warnings.append("Shop has no published products (expected until checkout is configured)")
print(f"\nAUTOMATED RESULTS: {len(checks)} passing checks; {len(errors)} errors; {len(warnings)} warnings")
for line in errors: print("ERROR: "+line)
for line in warnings: print("WARNING: "+line)
print("NOTE: external services (FormSubmit, WeTicket iframe, SoundCloud) and actual mobile browser layout require manual testing.")
sys.exit(1 if errors else 0)
