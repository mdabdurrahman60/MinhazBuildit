# DocScan — Smart Document Scanner

A 100% client-side, mobile-first web app for scanning 2-page documents.
It captures the front page with the device camera, runs Tesseract.js OCR
on the top-right corner to read a numeric ID (with automatic Bangla →
English digit conversion), captures the back page, and compiles both
pages into a single PDF (named after the extracted ID) using pdf-lib —
all in browser memory, with no backend and no server uploads.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL on your phone (same Wi-Fi network) or use
`npm run dev -- --host` and visit your machine's LAN IP from your phone's
browser. Camera access requires either `localhost` or HTTPS, so for
testing on a real device over LAN you may need a tool like `mkcert` or a
tunneling service (e.g. `ngrok`) to get HTTPS in development.

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build locally
```

## How it works

1. **Capture Page 1** — opens the device's rear camera (falls back to the
   native camera/photo picker if `getUserMedia` is unavailable or denied).
2. **OCR the ID** — the top-right 50% width × 25% height of the captured
   image is cropped onto an off-screen canvas, upscaled and contrast-
   boosted, then passed to Tesseract.js (`eng+ben` language data) to read
   the numeric ID. Bangla digits (০-৯) are automatically converted to
   English digits (0-9) before the ID is extracted.
3. **Verify** — the extracted ID is shown in an editable field so it can
   be corrected by hand if OCR misreads it.
4. **Capture Page 2** — the back page is captured the same way.
5. **Generate PDF** — both pages are compiled into a single PDF with
   pdf-lib and downloaded automatically as `<ID>.pdf`.
6. **Purge** — as soon as the download is triggered, both captured
   images' object URLs are revoked and their state is cleared from
   memory.

## Notes

- Tesseract.js downloads its `eng` and `ben` language trained-data files
  from a public CDN the first time OCR runs in a browser session; these
  are cached by the browser afterward. An internet connection is
  required for that first OCR pass, but no document image data is ever
  sent anywhere — only Tesseract's own language files are fetched.
- Camera access (`getUserMedia`) requires a secure context (HTTPS or
  `localhost`). On a plain HTTP LAN address, the app automatically falls
  back to the native file/camera picker.
- Tested against Android Chrome's mobile viewport; touch targets are
  sized for one-handed use.
