# MMSAR — Mallacoota Marine Search and Rescue

**Proposal website** for a community-led Marine Search and Rescue unit in Mallacoota, Victoria, Australia.

> **Not an operational service.**  
> In an emergency, dial **000** and ask for the Water Police.

| | |
|--|--|
| **Live (preferred)** | [https://mmsar.au/](https://mmsar.au/) |
| **Also** | [https://mmsar.org.au/](https://mmsar.org.au/) → **301** to mmsar.au |
| **GitHub** | [github.com/coldix/mmsar](https://github.com/coldix/mmsar) |
| **Project email** | [mallacootamsar@gmail.com](mailto:mallacootamsar@gmail.com) |

---

## About this proposal

MMSAR is a **proposed** incorporated association (not yet operational). The site argues for a **locally managed** volunteer unit under Victoria’s official MSAR framework.

Key facts on the site:

- ~**$7 million** emergency services base shared by **SES, Lifesaving, and MSAR**
- ~**$2 million** of MSAR assets deployed in Mallacoota, with an operating budget
- Context from the **2014** Victorian Parliamentary Inquiry / MSAR reform report (27-page PDF)
- Winter campaign: public list of where people stand, starting from zero, aiming for clarity before summer

---

## What the site does

- Full-viewport **animated rescue boat** hero (CSS + WebP asset)
- Vision copy + **Kuula 360° lake** embed
- Public **Alias list** of community positions (all views, including “fine with how it’s run now”)
- Signup form → **JSON store** + email to project Gmail
- YouTube + second Kuula media, reform PDF reader
- FAQ, SEO/schema, Open Graph share card for Facebook

---

## Stack

| Piece | Detail |
|--------|--------|
| Front end | Static HTML / CSS / JS (no build step) |
| Form API | PHP 8 on Hostinger (`api/submit.php`, `api/list.php`) |
| Storage | `data/submissions.json` (not web-readable) |
| Notify | Email → **mallacootamsar@gmail.com** |
| Analytics | Google Analytics `G-JKZW0CYEBL` |
| Hosting | Hostinger (`mmsar.au` public_html) |
| Domains | All www / org.au variants **301** → `https://mmsar.au/` |

---

## Repository layout

```
.
├── index.html              # Main page (hero, vision, form, list, FAQ, SEO)
├── thank-you.html          # No-JS form fallback target (noindex)
├── styles.css              # Layout, boat animation, mobile, form, voices
├── main.js                 # Theme, form submit, public list, PDF modal
├── deploy.sh               # rsync → Hostinger via ~/.ssh/gha_hostinger
├── .htaccess               # 301 to https://mmsar.au/ + security headers
├── .gitignore
├── robots.txt              # Allow site; disallow /data/ /api/
├── sitemap.xml
├── llms.txt                # Plain facts for AI crawlers
├── favicon.ico
├── apple-touch-icon.png
├── api/
│   ├── submit.php          # POST: validate, save JSON, email
│   └── list.php            # GET: public aliases only (no emails)
├── data/
│   ├── .htaccess           # Deny all web access
│   ├── README.md
│   └── submissions.json    # Live data on server (gitignored when filled)
└── images/
    ├── Naiad-1.webp        # Hero boat (compressed; used on site)
    ├── Naiad-1.png         # Source / fallback art
    ├── og-card.jpg         # Facebook/OG 1200×630
    ├── og-share.jpg        # Earlier OG variant
    ├── boat-sketch.jpg
    ├── boat-photo.jpg
    └── Vic-MSAR-Reform.pdf # 2014 reform report
```

**Not in git (or excluded from deploy):** `.DS_Store`, zips, live personal data in `submissions.json` when present, empty `mmsar/` folder.

---

## Public form & list

### Fields collected

| Field | Public? | Notes |
|--------|---------|--------|
| **Alias** | Yes | Shown on list; filtered for abuse/obscenity |
| **Email** | No | Valid + unique; project may email; **not released** |
| **Connection** | Yes (tags) | Live here, boat here, family/friends, interested, MSAR/emergency experience |
| **Where I stand** | Yes | Local management / local + offer to help / fine as-is / undecided |
| **Roles** | Yes if set | Optional if “offer to help” |
| **Comments** | No | Emailed to project only |

### Alias rules

- Required for public list  
- No `@` (not an email)  
- Server + client reject clear abuse (e.g. `Get Fu#ked`, leetspeak/obfuscation)  
- Public checkbox: trying to untick prompts to use an Alias instead  

### Intent options (order)

1. I support local management  
2. I support local management **and offer to help**  
3. I’m fine with how it is run now  
4. Undecided — stay informed  

### API

**POST** `api/submit.php`  
- JSON (`Content-Type: application/json`) → JSON response (used by `main.js`)  
- Form POST (no-JS) → 303 redirect to `thank-you.html`  

**GET** `api/list.php`  
- Returns `{ result, counts, entries: [{ alias, intent, intent_label, connection_labels, roles, date }] }`  
- **Never** returns email, IP, or comments  

---

## SEO & AI search

| Feature | Implementation |
|---------|----------------|
| Canonical | `https://mmsar.au/` |
| Open Graph / Twitter | Title, description, `images/og-card.jpg` (1200×630) |
| JSON-LD | Organization, WebSite, WebPage, FAQPage |
| On-page | `#about` fact box, `#faq` (aligned with schema) |
| AI plain text | `llms.txt` |
| Robots | Allow pages; disallow `/data/`, `/api/` |
| Share card | Re-scrape in [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) after deploy |

---

## Local preview

Form POST to PHP needs a server (or use live API only for full form test):

```bash
# Static only (JS form will fail POST unless you proxy PHP)
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

For full form behaviour, test on the live host after deploy.

---

## Deploy (Hostinger)

```bash
./deploy.sh
```

| Setting | Value |
|---------|--------|
| SSH key | `~/.ssh/gha_hostinger` |
| Host | `46.202.196.151` port `65002` |
| User | `u566466219` |
| Path | `domains/mmsar.au/public_html/` |

Deploy:

- rsync site files with safe perms (644/755)  
- Does **not** overwrite live `data/submissions.json`  
- Skips `.git`, README, `deploy.sh`, zips  

After CSS/JS changes, hard-refresh (cache-bust `?v=` on assets in `index.html`).

### Domain redirects

`.htaccess` forces a single origin:

- `http(s)://www.mmsar.au/*`  
- `http(s)://mmsar.org.au/*`  
- `http(s)://www.mmsar.org.au/*`  

→ **301** → `https://mmsar.au/…`

Only **https://mmsar.au/** should return 200 for HTML.

---

## Accessibility & performance

- Hero boat: CSS animation; `prefers-reduced-motion` freezes motion  
- Hero image: WebP ~64 KB (`Naiad-1.webp`), width/height set  
- Sticky emergency bar: always visible; shortened on small screens  
- Mobile: stacked form/stats, full-width buttons, safe-area padding  

---

## Contact

| Role | Contact |
|------|---------|
| Proposal / list | [mallacootamsar@gmail.com](mailto:mallacootamsar@gmail.com) |
| Coordinator | Colin Dixon — [col@dixon.au](mailto:col@dixon.au) |

---

## Status & licence

- Proposal materials for community advocacy  
- Subject to approval by **Emergency Management Victoria (EMV)**  
- Not an operational rescue service  

Third-party: YouTube, Kuula, Font Awesome, Google Fonts — their terms apply.

---

## Quick checklist (maintainers)

- [ ] `./deploy.sh` after content/code changes  
- [ ] Facebook debugger re-scrape if OG image/title changes  
- [ ] Download/backup `data/submissions.json` periodically  
- [ ] Search Console: preferred domain `mmsar.au`, sitemap `https://mmsar.au/sitemap.xml`  
- [ ] Never commit real submission emails to a public repo  
