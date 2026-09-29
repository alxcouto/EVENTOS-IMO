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

## 4. Platform Architecture & Hosting Structure

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
└── 26-09-30_BeLight/              # Event: Be-Light (2026-09-30)
    ├── 00-index.md                # Event-specific index
    ├── index.html                 # Event sub-landing page (Tier 2)
    ├── style.css                  # Event sub-landing styles
    ├── config.json                # Supabase & YouTube session mappings
    ├── embed.js                   # External embed & Matomo bridge script
    └── player/                    # Dedicated live player engine (Tier 3)
        ├── index.html             # Video player layout & back navigation
        ├── script.js              # Player engine with async config gating
        └── style.css              # Option B controls & subtitle styling
```
