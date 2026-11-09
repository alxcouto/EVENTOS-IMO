# Event Index: 26-11-12_TIR26

Index of files created and configured for the **TIR 2026 · Trends in Retina (6th Edition)** event (Dates: 2026-11-12 to 2026-11-14) within the **EVENTOS-IMO** platform (IMO Grupo Miranza Barcelona).

---

## Files Overview

| File | Description | Purpose |
| :--- | :--- | :--- |
| [00-index.md](./00-index.md) | Event Documentation | Local file index, configuration guide, and 10-session catalog for TIR 2026. |
| [Program_ENG_TIR_2026.pdf](./Program_ENG_TIR_2026.pdf) | Official Congress PDF | Visual design guide and complete 3-day scientific program & faculty reference. |
| [assets/speakers/](./assets/speakers/) | Speaker Portrait Assets | 27 high-resolution faculty portrait photos extracted from the official congress PDF for roll-over bio cards. |
| [index.html](./index.html) | Tier 2: Event Sub-Landing Page | TIR 2026 visual identity hero, 10-session quick-launch pill strip, 3-day interactive pill-like agenda with individual sub-lecture pills opening the player, Organising Committee & Speakers section, and embed drawer. |
| [style.css](./style.css) | Event Sub-Landing Stylesheet | TIR 2026 crimson-orange palette (`#E31E24`, `#F37021`), dark slate day headers (`#1B2432`), warm coral session cards (`#FDF3F0`), and interactive lecture pills. |
| [config.json](./config.json) | Event Configuration | Defines Supabase endpoint/keys and YouTube broadcast IDs for all 10 TIR 2026 sessions. |
| [embed.js](./embed.js) | Embed Script | Host-page injection script for embedding the player via iframe and bridging Matomo analytics. |
| [player/index.html](./player/index.html) | Tier 3: Dedicated Player UI | Video player shell, top navigation bar (`← Agenda TIR 2026`), 10-session dropdown selector + smooth-scrolling pills, Option B controls, and 2-line subtitle box. |
| [player/script.js](./player/script.js) | Web Client Application Engine | Multi-path `config.json` loader with async gating (`tryInitYouTubePlayer`), dual dropdown/pill sync, YouTube IFrame API controller, Supabase Realtime & historical caption sync, and Matomo postMessage bridge. |
| [player/style.css](./player/style.css) | Web Client Design System | Responsive stylesheet supporting dark/light themes (`data-theme`), slim navigation bar, session dropdown, scrollable pills strip, Option B controls, and subtitle typography. |
| [player/config.json](./player/config.json) | Local Config Mirror | Direct config access for client-side relative fetch (`./config.json`). |

---

## Configuration Summary

- **Supabase Project URL**: `https://kcdhrxtbylpaceeoglpq.supabase.co`
- **Anon Key**: `sb_publishable_KvFrI2hGpyT7bm0MW17mwQ_ycsLnIav`
- **Broadcast Sessions (10 Total)**:
  - **Thursday, November 12th**:
    - `SESSION_1`: `9MtaD5_oPL0` (3.05 pm — SESSION I · RETINA IN ACTION)
    - `WORKSHOP`: `1YjwN27pi-4` (5.00 pm — OCULAR ULTRASOUND WORKSHOPS AND VIRTUAL REALITY SURGICAL TRAINING)
  - **Friday, November 13th**:
    - `SESSION_2`: `OZDtmw2Gxno` (8.35 am — SESSION II · SURGICAL RETINA VIDEO SESSION 1. HOW THEY THINK, HOW THEY DO IT: LEARNING FROM THE EXPERTS)
    - `SESSION_3`: `9ZktoWvqvC4` (12.00 pm — SESSION III · WHAT IMAGING CAN AND CANNOT TELL US: LESSONS FROM HIGH MYOPIA AND UVEITIS)
    - `KEYNOTE_LECTURE`: `BlBzdjhzTys` (3.00 pm — DR. BORJA CORCÓSTEGUI KEYNOTE LECTURE · Stanislao Rizzo, MD, PhD)
    - `SESSION_4`: `-0yLICazZRU` (3.20 pm — SESSION IV · THE IMPORTANCE OF IMAGING IN RETINAL DIAGNOSIS)
    - `SESSION_5`: `c4RzexTbrYA` (5.00 pm — SESSION V · MEDICAL RETINA 2)
  - **Saturday, November 14th**:
    - `SESSION_6`: `P4QpSE959QY` (8.35 am — SESSION VI · SURGICAL RETINA VIDEO SESSION 2)
    - `SESSION_7`: `y3fQcCz-7oY` (11.00 am — SESSION VII · SURGICAL RETINA)
    - `SESSION_8`: `Sb6ppJMYaY0` (12.00 pm — SESSION VIII · YOU’VE GOT TALENT CHALLENGE)

---

## Access Paths

When served by the platform web server (`server.js`):
- **Event Sub-Landing (Agenda)**: `/26-11-12_TIR26/`
- **Dedicated Player by Session**: `/26-11-12_TIR26/player/?session=<session_key>` (e.g. `?session=SESSION_1`, `?session=WORKSHOP`, `?session=KEYNOTE_LECTURE`)
- **Official Program PDF**: `/26-11-12_TIR26/Program_ENG_TIR_2026.pdf`
- **Embed Script Source**: `/26-11-12_TIR26/embed.js`
- **Configuration Endpoint**: `/26-11-12_TIR26/config.json`
