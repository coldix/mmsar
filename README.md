# MMSAR — Mallacoota Marine Search and Rescue

**Community consultation website** for a proposed locally managed volunteer Marine Search and Rescue unit in Mallacoota, Victoria, Australia.

> **Not an operational service.**  
> In an emergency, dial **000** and ask for the Water Police.

| | |
|--|--|
| **Live (preferred)** | [https://mmsar.au/](https://mmsar.au/) |
| **Other hosts** | `www.mmsar.au`, `mmsar.org.au`, `www.mmsar.org.au` → **301** to `https://mmsar.au/` |
| **GitHub** | [github.com/coldix/mmsar](https://github.com/coldix/mmsar) |
| **Project email** | [mallacootamsar@gmail.com](mailto:mallacootamsar@gmail.com) |
| **Coordinator** | Colin Dixon — [col@dixon.au](mailto:col@dixon.au) |

---

## Purpose (current stage)

This is **not** a heavy public pressure campaign or recruitment drive.

Immediate aims:

1. Email former Mallacoota Coast Guard members and experienced local marine rescue contacts.
2. Ask them to indicate support, preference for current arrangements, undecided, or possible willingness to help.
3. Share in local Facebook groups to raise awareness and invite informed comment.
4. Establish whether there is enough local interest, experience and concern to justify taking the proposal further.

The coordinator believes local management under Victoria’s MSAR framework deserves serious consideration. The site makes that position clear while inviting **all views**, including support for present arrangements.

**No decision has been made that a new unit will proceed.**

---

## Key facts on the site

- ~**$7 million** emergency services base shared by **SES, Lifesaving, and MSAR**
- ~**$2 million** of MSAR assets in Mallacoota, with an operating budget
- Experienced local boat operators and former volunteers
- **2014** Victorian Parliamentary Inquiry / MSAR reform report (27-page PDF) — cited as relevant context (proposal’s view, not stated as uncontested fact)
- Incorporated association; **not operational**

---

## What the site includes

| Feature | Notes |
|---------|--------|
| Hero | Animated rescue vessel (`Naiad-1.webp`), consultation headline |
| Disclaimer | Sticky bar + section: consultation only; dial **000** |
| At a glance | Dense fact block for people / SEO / AI |
| Vision | Copy + tall Kuula **360° lake** (`LKzQh`, auto-rotate, `loading="lazy"`) |
| Public form | `#support` — Alias, email, connection, position |
| Public list | `#voices` — Alias + position + connection tags only |
| Media | YouTube + second Kuula (wharf) |
| Inquiry PDF | On-page viewer + download |
| FAQ | Consultation-focused (not replace campaign, no volunteer commitment, Alias) |
| Thank-you | Neutral confirmation after no-JS form POST |

---

## Stack

| Piece | Detail |
|--------|--------|
| Front end | Static HTML / CSS / JS (no build) |
| Form API | PHP on Hostinger — `api/submit.php`, `api/list.php` |
| Storage | `data/submissions.json` (blocked from web by `.htaccess`) |
| Notify | Email → **mallacootamsar@gmail.com** |
| Analytics | Google Analytics `G-JKZW0CYEBL` |
| Hosting | Hostinger `domains/mmsar.au/public_html/` |
| Deploy | `./deploy.sh` (rsync + SSH key `~/.ssh/gha_hostinger`) |

---

## Repository layout

```
.
├── index.html              # Main page
├── thank-you.html          # Form fallback (noindex)
├── styles.css              # Design + animation + mobile
├── main.js                 # Theme, form, list, PDF modal
├── deploy.sh               # Deploy to Hostinger
├── .htaccess               # 301 → https://mmsar.au/
├── .gitignore
├── robots.txt              # Disallow /data/ /api/
├── sitemap.xml
├── llms.txt                # Plain facts for AI crawlers
├── favicon.ico
├── apple-touch-icon.png
├── api/
│   ├── submit.php          # Validate, save, email; JSON or thank-you redirect
│   └── list.php            # Public list (no emails)
├── data/
│   ├── .htaccess           # Deny all
│   ├── README.md
│   └── submissions.json    # Live only on server (gitignored)
└── images/
    ├── Naiad-1.webp        # Hero (~64 KB, 1600×739)
    ├── Naiad-1.png         # Source art
    ├── og-card.jpg         # Facebook share 1200×630 (title on image)
    ├── og-share.jpg        # Earlier OG variant
    ├── boat-sketch.jpg
    ├── boat-photo.jpg
    └── Vic-MSAR-Reform.pdf
```

**Not in git:** live `submissions.json` content, zips, `.DS_Store`.

---

## Public consultation form

### Position options (no default — user must choose)

1. I support local management  
2. I support local management and may be willing to help  
3. I am satisfied with how it is run now  
4. I am undecided and would like to stay informed  

Same wording is used for form options, list badges (`intent_label` in `api/list.php`), and filter buttons.

### Connection (multi-select, at least one)

- I live here  
- I boat here  
- Family or friends live or boat here  
- Just following / interested  
- Marine rescue / emergency experience  

### Alias & privacy

- **Public:** Alias, position, connection tags  
- **Private:** email (valid + unique), comments  
- Email list is **not released** to third parties  
- Public list checkbox cannot be unticked (popup directs user to use an **Alias**)  
- Offensive Alias filter (client + server), including common obfuscation  

### API behaviour

| Endpoint | Behaviour |
|----------|-----------|
| `POST api/submit.php` | JSON from `main.js` → JSON result; bare form POST → 303 `thank-you.html` |
| `GET api/list.php` | `alias`, `intent`, `intent_label`, `connection` / `connection_labels`, `roles`, `date` only |

---

## SEO, Open Graph, domains

| Item | Implementation |
|------|----------------|
| Canonical | `https://mmsar.au/` |
| OG / Twitter title | *Should Mallacoota marine rescue be managed locally?* |
| OG description | Consultation tone; all views welcome |
| OG image | `https://mmsar.au/images/og-card.jpg?v=2` (question text **on** the image) |
| JSON-LD | Organization, WebSite, WebPage, FAQPage |
| 301s | `.htaccess` — all other hosts/schemes → apex HTTPS |
| Mobile banner | Condensed one-line on small screens; **000** always visible |

### Facebook (first share)

Site has not been widely shared yet. Before the first post, optional preview:

1. [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)  
2. URL: `https://mmsar.au/`  
3. Scrape once and confirm card title + image  

---

## Local preview & deploy

```bash
# Static preview
python3 -m http.server 8765

# Production deploy
./deploy.sh
```

| SSH | Value |
|-----|--------|
| Key | `~/.ssh/gha_hostinger` |
| Host | `46.202.196.151` port `65002` |
| User | `u566466219` |
| Path | `domains/mmsar.au/public_html/` |

Deploy does **not** overwrite live `data/submissions.json`. Bump `?v=` on CSS/JS/assets in `index.html` when those files change.

---

## Accessibility & performance

- Boat animation respects `prefers-reduced-motion`  
- Hero WebP + width/height attributes  
- Below-fold Kuula / YouTube use `loading="lazy"`  
- Vision 360: auto-rotate on, tall frame fill  

---

## Status

- Proposal materials for community consultation  
- Not an operational rescue service  
- Future unit (if any) would depend on local interest and the Victorian MSAR framework / relevant approvals  

Third-party: YouTube, Kuula, Font Awesome, Google Fonts — their terms apply.

---

## End-of-day maintainer checklist

- [x] Consultation wording live (not campaign tone)  
- [x] Meta / OG / `og-card.jpg` aligned with title question  
- [x] Position labels consistent (form · badges · filters)  
- [x] Alias public list + privacy + abuse filter  
- [x] 301 domain consolidation  
- [x] Hero WebP, form POST, mobile 000 banner  
- [x] README + GitHub `main` updated  
- [ ] First Facebook share / optional debugger scrape when posting  
- [ ] Periodic backup of server `data/submissions.json`  
- [ ] Search Console: property + sitemap `https://mmsar.au/sitemap.xml` (when ready)  
