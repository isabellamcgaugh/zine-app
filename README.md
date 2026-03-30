# Zine-O-Matic

Daily photo + reflection UI. Runs in the browser with **no npm install** (React via CDN + Babel).

## Run locally

From this folder:

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080** (camera needs **localhost** or **HTTPS**, not `file://`).

## What’s implemented

- **Mood screen:** Pick a daily mood; the whole app tints to match until tomorrow (`#/mood`).
- **First content screen:** Daily prompt page (`#/prompt`) — camera, text, NEW PROMPT.
- **Live camera** in the main frame (`getUserMedia`); **capture** with the middle button.
- **Photo library:** left button opens file picker (`accept="image/*"`).
- **Fullscreen camera:** right button (`requestFullscreen` or `webkitEnterFullscreen` on iOS).
- **32 prompts:** NEW PROMPT picks another random prompt; title + textarea placeholder stay in sync.
- **Editable text** saved to **`localStorage`** (`zine-o-matic-entries-v2`), with a short “Saved” hint on blur.
- **Zine grid:** `#/library` — pick a page, **Edit**, **Export** (print & PNG), or **Flip through zine** on its own screen.
- **Print & export** (`#/export`): Margins, photo fit, A5 sheet preview, PNG download, print. Settings are saved for the flipbook preview.
- **Flipbook** (`#/flipbook`): **StPageFlip** ([page-flip](https://github.com/Nodlik/StPageFlip)) HTML page-turn preview; photo fit follows Print & export prefs.

## Files

- `index.html` — entry, fonts, StPageFlip bundle, React + `src/app.jsx`
- `src/app.jsx` — UI, routing, camera, storage, flipbook (StPageFlip)
- `src/styles/global.css` — layout, type, and glass-style look
