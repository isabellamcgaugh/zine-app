# Zine-O-Matic

Daily photo + reflection UI. Runs in the browser with **no npm install** (React via CDN + Babel).

## Run locally

From this folder:

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080** (camera needs **localhost** or **HTTPS**, not `file://`).

## What’s implemented

- **First screen:** Daily prompt page (`#/prompt`) — camera, text, NEW PROMPT.
- **Live camera** in the main frame (`getUserMedia`); **capture** with the middle button.
- **Photo library:** left button opens file picker (`accept="image/*"`).
- **Fullscreen camera:** right button (`requestFullscreen` or `webkitEnterFullscreen` on iOS).
- **32 prompts:** NEW PROMPT picks another random prompt; title + textarea placeholder stay in sync.
- **Editable text** saved to **`localStorage`** (`zine-o-matic-entries-v2`), with a short “Saved” hint on blur.
- **Zine grid:** `#/library` — “My zine pages” / “Today’s prompt” links between screens.

## Files

- `index.html` — entry, loads React + `src/app.jsx`
- `src/app.jsx` — UI, routing, camera, storage
- `src/styles/global.css` — layout and glass-style look
