# EVENTOS-IMO - Project Index

Master index of project documentation, platform infrastructure, and event instances for the **EVENTOS-IMO** live broadcast platform (IMO Grupo Miranza).

---

## 1. Project Documentation

- [00-index.md](./00-index.md) - Master index of the EVENTOS-IMO repository and event files.
- [01-idea.md](./01-idea.md) - Project vision, 3-tier architecture, Miranza design branding, Railway hosting architecture, and backup specifications.
- [02-Implementation.md](./02-Implementation.md) - Phase-gated technical implementation roadmap, 3-tier architecture flow, component breakdown, and verification protocols.

---

## 2. Platform Core Infrastructure (Tier 1: Platform Directory)

| File Path | Description | Key Responsibilities |
| :--- | :--- | :--- |
| [index.html](./index.html) | Platform Directory Landing Page | Miranza-styled event directory, hero banner, live emission indicator, and event cards linking directly to dedicated event sub-landings. |
| [style.css](./style.css) | Platform Design System | Minimalist clinical CSS tokens (`#002D62`, `#00669D`, `#73cf91`, `#F7F9FA`), responsive event card grid, and animations. |
| [server.js](./server.js) | HTTP Server & Multi-Tier Router | Multi-event routing engine serving event sub-landings (`/<event>/`), dedicated players (`/<event>/player/`), intelligent sub-asset resolution (`style.css`, `script.js`), CORS headers, and structured logging. |
| [package.json](./package.json) | Node.js Manifest | Process scripts (`start`, `dev`) and runtime engine specifications for Railway deployment. |
| [.gitignore](./.gitignore) | Version Control Ignore | Excludes OS metadata (`.DS_Store`), temporary build files, and local dependencies. |

---

## 3. Event: `26-09-30_BeLight` (Tier 2: Sub-Landing & Tier 3: Player)

Files created and configured for the **Be-Light** live event (Date: 2026-09-30):

| File Path | Description | Key Responsibilities |
| :--- | :--- | :--- |
| [26-09-30_BeLight/00-index.md](./26-09-30_BeLight/00-index.md) | Event Documentation | Local file catalog and configuration guide for the Be-Light event. |
| [26-09-30_BeLight/index.html](./26-09-30_BeLight/index.html) | Tier 2: Event Sub-Landing Page | Breadcrumbs, surgical hero banner, date, event description, session selector cards (Sesión 1 & 2), and embed drawer. |
| [26-09-30_BeLight/style.css](./26-09-30_BeLight/style.css) | Event Sub-Landing Stylesheet | Miranza-themed layout styles, breadcrumb trail, and session card hover effects. |
| [26-09-30_BeLight/config.json](./26-09-30_BeLight/config.json) | Event Configuration | Supabase project URL (`https://kcdhrxtbylpaceeoglpq.supabase.co`), public anon key, and YouTube broadcast IDs (`session_1: JVe72x6qjfo`, `session_2: XZ6oYuFedCk`). |
| [26-09-30_BeLight/embed.js](./26-09-30_BeLight/embed.js) | Embeddable Helper Script | Discovers `.livespeech-embed` containers on host pages, injects responsive isolated iframes, passes theme/session parameters, and bridges player telemetry to host Matomo `_paq` and MediaAnalytics. |
| [26-09-30_BeLight/player/index.html](./26-09-30_BeLight/player/index.html) | Tier 3: Dedicated Player UI | Responsive video player shell, top navigation bar (`← Volver a Be-Light 2026`), session switcher pills (`Sesión 1` \| `Sesión 2`), Option B controls, and 2-line subtitle display box. |
| [26-09-30_BeLight/player/script.js](./26-09-30_BeLight/player/script.js) | Web Client Application Engine | Multi-path `config.json` loader with async gating (`tryInitYouTubePlayer`), active session pill highlighting, YouTube IFrame API controller, Supabase Realtime & historical caption sync, and Matomo postMessage bridge. |
| [26-09-30_BeLight/player/style.css](./26-09-30_BeLight/player/style.css) | Web Client Design System | Responsive stylesheet supporting dark/light themes (`data-theme`), player navigation bar, high-contrast subtitle typography, custom video controls, and poster fallback cards. |

---

## 4. Event: `26-10-22_ARI26` (Tier 2: Sub-Landing & Tier 3: Player)

Files created and configured for the **ARI 2026** live event (Date: 2026-10-22):

| File Path | Description | Key Responsibilities |
| :--- | :--- | :--- |
| [26-10-22_ARI26/00-index.md](./26-10-22_ARI26/00-index.md) | Event Documentation | Local file catalog, configuration guide, and 21-session inventory for ARI 2026. |
| [26-10-22_ARI26/index.html](./26-10-22_ARI26/index.html) | Tier 2: Event Sub-Landing Page | Breadcrumbs, Miranza clinical hero banner, date, interactive compact agenda with live search and category filter, direct session player CTAs, and embed drawer. |
| [26-10-22_ARI26/style.css](./26-10-22_ARI26/style.css) | Event Sub-Landing Stylesheet | Styles for hero header, search input, filter pills, and compact interactive agenda cards. |
| [26-10-22_ARI26/config.json](./26-10-22_ARI26/config.json) | Event Configuration | Supabase project URL (`https://yzxnkotfjatpfflklaer.supabase.co`), public anon key, and YouTube broadcast IDs for all 21 event sessions. |
| [26-10-22_ARI26/embed.js](./26-10-22_ARI26/embed.js) | Embeddable Helper Script | Discovers `.livespeech-embed` containers, injects isolated iframes, passes session parameters, and bridges telemetry to host Matomo `_paq`. |
| [26-10-22_ARI26/player/index.html](./26-10-22_ARI26/player/index.html) | Tier 3: Dedicated Player UI | Responsive video player shell, top navigation bar (`← Agenda ARI 2026`), 21-session dropdown selector + smooth-scrolling pills, Option B controls, and 2-line subtitle display box. |
| [26-10-22_ARI26/player/script.js](./26-10-22_ARI26/player/script.js) | Web Client Application Engine | Multi-path `config.json` loader with async gating (`tryInitYouTubePlayer`), dual dropdown/pill sync, YouTube IFrame API controller, Supabase Realtime captions, and Matomo postMessage bridge. |
| [26-10-22_ARI26/player/style.css](./26-10-22_ARI26/player/style.css) | Web Client Design System | Responsive stylesheet supporting dark/light themes (`data-theme`), slim navigation bar, session dropdown, scrollable pills strip, Option B controls, and subtitle typography. |
| [26-10-22_ARI26/player/config.json](./26-10-22_ARI26/player/config.json) | Local Config Mirror | Direct config access for client-side relative fetch (`./config.json`). |

---

## 5. Event: `26-11-12_TIR26` (Tier 2: Sub-Landing & Tier 3: Player)

Files created and configured for the **TIR 2026 · Trends in Retina (6th Edition)** live event (Dates: 2026-11-12 to 2026-11-14):

| File Path | Description | Key Responsibilities |
| :--- | :--- | :--- |
| [26-11-12_TIR26/00-index.md](./26-11-12_TIR26/00-index.md) | Event Documentation | Local file catalog, configuration guide, and 10-session inventory for TIR 2026. |
| [26-11-12_TIR26/Program_ENG_TIR_2026.pdf](./26-11-12_TIR26/Program_ENG_TIR_2026.pdf) | Official Congress PDF | Visual reference and downloadable 3-day scientific program (English). |
| [26-11-12_TIR26/index.html](./26-11-12_TIR26/index.html) | Tier 2: Event Sub-Landing Page | TIR 2026 cover-styled hero, 10-session quick-launch pill strip, 3-day interactive pill agenda (every session and sub-lecture pill opens the player), Organising Committee & Speakers directory, and embed drawer. |
| [26-11-12_TIR26/style.css](./26-11-12_TIR26/style.css) | Event Sub-Landing Stylesheet | TIR 2026 crimson-orange gradient (`#E31E24` → `#F37021`), dark slate day banners (`#1B2432`), warm coral session cards, and interactive lecture pills. |
| [26-11-12_TIR26/config.json](./26-11-12_TIR26/config.json) | Event Configuration | Supabase project URL (`https://kcdhrxtbylpaceeoglpq.supabase.co`), public anon key, and YouTube broadcast IDs for all 10 event sessions (`SESSION_1`–`SESSION_8`, `WORKSHOP`, `KEYNOTE_LECTURE`). |
| [26-11-12_TIR26/embed.js](./26-11-12_TIR26/embed.js) | Embeddable Helper Script | Discovers `.livespeech-embed` containers, injects isolated iframes, passes session parameters, and bridges telemetry to host Matomo `_paq`. |
| [26-11-12_TIR26/player/index.html](./26-11-12_TIR26/player/index.html) | Tier 3: Dedicated Player UI | Responsive video player shell, top navigation bar (`← Agenda TIR 2026`), 10-session dropdown selector + smooth-scrolling pills, Option B controls, and 2-line subtitle display box. |
| [26-11-12_TIR26/player/script.js](./26-11-12_TIR26/player/script.js) | Web Client Application Engine | Multi-path `config.json` loader with async gating (`tryInitYouTubePlayer`), dual dropdown/pill sync, YouTube IFrame API controller, Supabase Realtime captions, and Matomo postMessage bridge. |
| [26-11-12_TIR26/player/style.css](./26-11-12_TIR26/player/style.css) | Web Client Design System | Responsive stylesheet supporting dark/light themes (`data-theme`), slim navigation bar, session dropdown, scrollable pills strip, Option B controls, and subtitle typography. |
| [26-11-12_TIR26/player/config.json](./26-11-12_TIR26/player/config.json) | Local Config Mirror | Direct config access for client-side relative fetch (`./config.json`). |

---

## 6. Platform Architecture & Hosting Structure

Current repository and deployment layout on Railway:

```text
EVENTOS-IMO/
├── .gitignore                     # Git ignore rules
├── 00-index.md                    # Master documentation & file index
├── 01-idea.md                     # Project ideation & specifications (3-tier architecture)
├── 02-Implementation.md           # Implementation plan & phase checklist
├── package.json                   # Node.js server dependencies & scripts
├── server.js                      # Multi-event HTTP routing engine
├── index.html                     # Platform directory page (links to event sub-landings)
├── style.css                      # Platform directory styling (Miranza design)
├── 26-09-30_BeLight/              # Event: Be-Light (2026-09-30)
│   ├── 00-index.md                # Event-specific index
│   ├── index.html                 # Event sub-landing page (Tier 2)
│   ├── style.css                  # Event sub-landing styles
│   ├── config.json                # Supabase & YouTube session mappings
│   ├── embed.js                   # External embed & Matomo bridge script
│   └── player/                    # Dedicated live player engine (Tier 3)
│       ├── index.html             # Video player layout & back navigation
│       ├── script.js              # Player engine with async config gating
│       └── style.css              # Option B controls & subtitle styling
├── 26-10-22_ARI26/                # Event: ARI 2026 (2026-10-22)
│   ├── 00-index.md                # Event-specific index & session catalog
│   ├── index.html                 # Compact interactive agenda & session picker (Tier 2)
│   ├── style.css                  # Event sub-landing styles
│   ├── config.json                # Supabase & YouTube session mappings (21 sessions)
│   ├── embed.js                   # External embed & Matomo bridge script
│   └── player/                    # Dedicated live player engine (Tier 3)
│       ├── index.html             # Player layout + 21-session dropdown & scrolling pills
│       ├── script.js              # Player engine with async config gating
│       ├── style.css              # Option B controls & subtitle styling
│       └── config.json            # Local config mirror
└── 26-11-12_TIR26/                # Event: TIR 2026 - Trends in Retina (2026-11-12 to 14)
    ├── 00-index.md                # Event-specific index & 10-session catalog
    ├── Program_ENG_TIR_2026.pdf   # Official congress program PDF
    ├── index.html                 # 3-day interactive pill agenda & faculty directory (Tier 2)
    ├── style.css                  # TIR 2026 crimson-orange sub-landing styles
    ├── config.json                # Supabase & YouTube session mappings (10 sessions)
    ├── embed.js                   # External embed & Matomo bridge script
    └── player/                    # Dedicated live player engine (Tier 3)
        ├── index.html             # Player layout + 10-session dropdown & scrolling pills
        ├── script.js              # Player engine with async config gating
        ├── style.css              # Option B controls & subtitle styling
        └── config.json            # Local config mirror
```
