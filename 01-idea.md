# EVENTOS-IMO: PLATFORM IDEA & ARCHITECTURE

## 1. Executive Concept & Purpose
- A multi-event broadcasting platform for **IMO Grupo Miranza** live surgical sessions, symposiums, and medical conferences.
- Built on a **3-Tier Hierarchy** to provide clean navigation, event isolation, and seamless scalability:
  1. **Tier 1: Platform Index (`/`)**: Central directory listing all IMO events (active, upcoming, past) with direct links to each event's dedicated sub-landing page.
  2. **Tier 2: Event Sub-Landing Page (`/<event>/`)**: Dedicated portal for a specific event (e.g. `/26-09-30_BeLight/`), detailing the event, medical agenda, and providing session selection buttons pointing to the dedicated player.
  3. **Tier 3: Dedicated Live Player (`/<event>/player/?session=<session_id>`)**: Dedicated video player with Option B custom controls, AI subtitle streaming via Supabase Realtime, language switcher (ES/EN), audio reader (TTS), session switcher pills, and back navigation to the event sub-landing.

---

## 2. Platform Directory Structure & Hosting Model

### Railway Project & GitHub Repository (`EVENTOS-IMO`):
```
Projects/EVENTOS-IMO/
├── index.html                  # Tier 1: Platform Root Directory Landing
├── style.css                   # Platform Miranza Design System
├── package.json                # Node.js start scripts
├── server.js                   # Zero-dependency Multi-Event HTTP Server
├── .gitignore                  # Git exclusions (.DS_Store, logs)
├── 00-index.md                 # Project & file catalog
├── 01-idea.md                  # Conceptual specification & architecture
├── 02-Implementation.md        # Phase-gated task roadmap
└── 26-09-30_BeLight/           # Event Subfolder
    ├── index.html              # Tier 2: Event Sub-Landing Page
    ├── style.css               # Event landing layout styles
    ├── config.json             # Supabase credentials & YouTube session broadcast IDs
    ├── embed.js                # Embed script for third-party medical partners
    └── player/                 # Tier 3: Dedicated Player Engine
        ├── index.html          # Player UI + back navigation + session pills
        ├── script.js           # Async config loader + YouTube API + Supabase Realtime
        └── style.css           # Option B video controls & subtitle display styles
```

---

## 3. Server Routing & URL Conventions

- **Platform Root**: `https://<domain>/` -> Serves `index.html` (directory of all events).
- **Event Sub-Landing**: `https://<domain>/26-09-30_BeLight/` -> Serves `26-09-30_BeLight/index.html` (event details and session picker).
- **Dedicated Player**: `https://<domain>/26-09-30_BeLight/player/?session=session_1` -> Serves `26-09-30_BeLight/player/index.html` with query parameters.
- **Sub-Assets & Config Resolution**:
  - `player/script.js` and `player/style.css` resolve directly from `player/`.
  - If `player/config.json` is requested, the server automatically resolves `26-09-30_BeLight/config.json`.
  - `embed.js` can be embedded by third parties from `https://<domain>/26-09-30_BeLight/embed.js`.
  - Backward compatibility: `/Client/` automatically rewrites to `/player/`.

---

## 4. Architectural Rules & Robustness (Bug Prevention)

1. **Async Config Gating**:
   - The player engine (`player/script.js`) strictly gates player initialization (`tryInitYouTubePlayer`).
   - `new YT.Player(...)` is **never** instantiated until `config.json` has finished loading over HTTP. This prevents race conditions where default fallback IDs play while loading the correct event.
2. **Zero Cross-Event ID Contamination**:
   - Fallback configurations must belong strictly to the target event or remain neutral. No external event broadcast IDs (e.g. ARI2026) are hardcoded.
3. **Local Repository as Single Source of Truth**:
   - The local folder `Projects/EVENTOS-IMO` is the master backup.
   - Pushing to GitHub `main` branch triggers automatic Railway continuous deployment.

---

## 5. Design Decisions & Branding (Miranza Aesthetic)

- **Palette**: Minimalist, clean clinical design inspired by `www.miranza.es`:
  - Deep Navy: `#002D62`
  - Clinical Blue: `#00669D` (Hover: `#004D77`)
  - Miranza Accent Green: `#73cf91`
  - Live Red Indicator: `#DC2626`
  - Light Background: `#F7F9FA`
  - Card White: `#FFFFFF`
- **Typography**: Google Fonts Inter, high-legibility sans-serif with clinical badges and pill indicators.

---

## 6. Future Roadmap: New Event Wizard

- Browser-based form/modal accessible from the EVENTOS-IMO landing page.
- Enables administrators to:
  1. Input event title, dates, specialty, and slug (`YY-MM-DD_EventName`).
  2. Paste or upload a `config.json` with Supabase credentials and YouTube broadcast IDs.
  3. Automatically scaffold the event folder with `index.html` (sub-landing) and `player/` (player engine).
  4. Automatically add a new card to the platform index.
