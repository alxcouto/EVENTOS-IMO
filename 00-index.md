# EVENTOS-IMO - Project Index

Master index of project documentation, platform infrastructure, and event instances for the **EVENTOS-IMO** live broadcast platform (IMO Grupo Miranza).

---

## 1. Project Documentation

- [00-index.md](./00-index.md) - Master index of the EVENTOS-IMO repository and event files.
- [01-idea.md](./01-idea.md) - Project vision, core requirements, Miranza design branding, Railway hosting architecture, and backup specifications.
- [02-Implementation.md](./02-Implementation.md) - Phase-gated technical implementation roadmap, architecture flow, component breakdown, and verification protocols.

---

## 2. Platform Core Infrastructure

| File Path | Description | Key Responsibilities |
| :--- | :--- | :--- |
| [index.html](./index.html) | Platform Landing Page | Miranza-styled event index, hero banner, live emission indicator, event cards, session direct-access buttons, and embed code viewer. |
| [style.css](./style.css) | Platform Design System | Minimalist clinical CSS tokens (`#002D62`, `#00669D`, `#73cf91`, `#F7F9FA`), responsive event card grid, and animations. |
| [server.js](./server.js) | HTTP Server & Internal Rewrite | Multi-event routing engine with internal rewrite (`/26-09-30_BeLight/` -> `Client/index.html`), intelligent sub-asset resolution (`style.css`, `script.js`), CORS headers, and structured logging. |
| [package.json](./package.json) | Node.js Manifest | Process scripts (`start`, `dev`) and runtime engine specifications for Railway deployment. |
| [.gitignore](./.gitignore) | Version Control Ignore | Excludes OS metadata (`.DS_Store`), temporary build files, and local dependencies. |

---

## 3. Event: `26-09-30_BeLight`

Files created and configured for the **Be-Light** live event (Date: 2026-09-30):

| File Path | Description | Key Responsibilities |
| :--- | :--- | :--- |
| [26-09-30_BeLight/00-index.md](./26-09-30_BeLight/00-index.md) | Event Documentation | Local file catalog and configuration guide for the Be-Light event. |
| [26-09-30_BeLight/config.json](./26-09-30_BeLight/config.json) | Event Configuration | Supabase project URL (`https://kcdhrxtbylpaceeoglpq.supabase.co`), public anon key, and YouTube broadcast IDs (`session_1: JVe72x6qjfo`, `session_2: XZ6oYuFedCk`). |
| [26-09-30_BeLight/embed.js](./26-09-30_BeLight/embed.js) | Embeddable Helper Script | Discovers `.livespeech-embed` containers on host pages, injects responsive isolated iframes, passes theme/session parameters, and bridges player telemetry to host Matomo `_paq` and MediaAnalytics. |
| [26-09-30_BeLight/Client/index.html](./26-09-30_BeLight/Client/index.html) | Web Client HTML5 UI | Responsive video player shell, Option B control shields, central unmute overlay, custom HTML5 controls (play/pause, volume/mute, fullscreen), dynamic AI subtitle disclaimer, language selector, and 2-line subtitle display box. |
| [26-09-30_BeLight/Client/script.js](./26-09-30_BeLight/Client/script.js) | Web Client Application Engine | Multi-path `config.json` loader, YouTube IFrame API controller, Supabase Realtime & historical caption sync, dynamic timecode alignment, Web Speech API TTS reader, viewer session heartbeat telemetry, and Matomo postMessage bridge. |
| [26-09-30_BeLight/Client/style.css](./26-09-30_BeLight/Client/style.css) | Web Client Design System | Responsive stylesheet supporting dark/light themes (`data-theme`), high-contrast subtitle typography, custom video controls, poster fallback cards, and mobile viewport adaptations. |
| [26-09-30_BeLight/Client/config.json](./26-09-30_BeLight/Client/config.json) | Local Client Configuration | Mirror of the event config placed inside `Client/` for direct relative `./config.json` path resolution. |

---

## 4. Platform Architecture & Hosting Structure

Current repository and deployment layout on Railway:

```text
EVENTOS-IMO/
├── .gitignore                     # Git ignore rules
├── 00-index.md                    # Master documentation & file index
├── 01-idea.md                     # Project ideation & specifications
├── 02-Implementation.md           # Implementation plan & phase checklist
├── package.json                   # Node.js server dependencies & scripts
├── server.js                      # Multi-event HTTP routing & internal rewrite engine
├── index.html                     # Platform landing page (index of all events)
├── style.css                      # Platform landing page styling (Miranza design)
└── 26-09-30_BeLight/              # Event: Be-Light (2026-09-30)
    ├── 00-index.md                # Event-specific index
    ├── config.json                # Supabase & YouTube session mappings
    ├── embed.js                   # External embed & Matomo bridge script
    └── Client/
        ├── index.html             # Event live player page
        ├── script.js              # Realtime subtitles & YouTube player engine
        ├── style.css              # Player styling & theme tokens
        └── config.json            # Local relative config fallback
```
