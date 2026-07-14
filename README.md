# MMSAR — Mallacoota Marine Search and Rescue

**Proposal website** for a community-led Marine Search and Rescue unit in Mallacoota, Victoria.

> **Not an operational service.**  
> In an emergency, dial **000** and ask for the Water Police.

Live sites:

- [https://mmsar.au/](https://mmsar.au/)
- [https://mmsar.org.au/](https://mmsar.org.au/)

## About

MMSAR is a **proposal** to establish a locally managed volunteer MSAR unit under the official Victorian framework. The association is **incorporated** but **not yet operational**. Government-funded facilities and vessels in Mallacoota create an opportunity for stronger local emergency response.

This site:

- Explains the vision and context
- Collects community survey responses and non-binding pledges
- Links to MSAR training documents and reform background reading
- Features an animated Naiad rescue boat on the home page

## Stack

| Piece | Detail |
|--------|--------|
| Front end | Static HTML, CSS, JavaScript (no build step) |
| Form backend | Google Apps Script → spreadsheet |
| Analytics | Google Analytics (`G-JKZW0CYEBL`) |
| Hosting | Static file host (both domains) |

## Project structure

```
.
├── index.html          # Main proposal page (hero + form)
├── thank-you.html      # Optional thank-you page
├── styles.css          # Design system + boat animation
├── main.js             # Theme toggle + survey/pledge form
├── favicon.ico
├── apple-touch-icon.png
├── robots.txt
├── sitemap.xml
└── images/
    ├── Naiad-1.png           # Hero boat (animated)
    ├── boat-sketch.jpg       # Secondary illustration
    ├── boat-photo.jpg        # Archive / reference
    └── Vic-MSAR-Reform.pdf   # Background reading
```

## Local preview

No install required. From the project root:

```bash
python3 -m http.server 8765
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Or open `index.html` directly in a browser (form posts still need network access to Google Apps Script).

## Deploy

Upload the site files to the web root for **mmsar.au** and **mmsar.org.au** (same content on both domains is fine).

Typical publish set:

- `index.html`, `thank-you.html`
- `styles.css`, `main.js`
- `favicon.ico`, `apple-touch-icon.png`
- `robots.txt`, `sitemap.xml`
- `images/` (entire folder)

Do **not** publish `.git/`, this README, or local zip archives unless you want them public.

## Form backend

Survey and pledge submissions POST JSON to a Google Apps Script web app URL defined in `main.js` (`WEB_APP_URL`). Field names must stay in sync with the script and spreadsheet columns.

## Accessibility & motion

The hero boat animation is pure CSS. Users with `prefers-reduced-motion: reduce` see a static boat.

## Contact

| Role | Contact |
|------|---------|
| Proposal enquiries | [mallacootamsar@gmail.com](mailto:mallacootamsar@gmail.com) |
| Coordinator | Colin Dixon — [col@dixon.au](mailto:col@dixon.au) |

## Licence / status

Proposal materials for community advocacy. MMSAR is subject to approval by Emergency Management Victoria (EMV) and is not yet an operational rescue service.

Third-party embeds (YouTube, Kuula, Font Awesome, Google Fonts) remain under their respective terms.
