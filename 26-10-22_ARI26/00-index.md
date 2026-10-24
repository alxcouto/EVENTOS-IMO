# Event Index: 26-10-22_ARI26

Index of files created and configured for the **ARI 2026** event (Date: 2026-10-22) within the **EVENTOS-IMO** platform (IMO Grupo Miranza).

---

## Files Overview

| File | Description | Purpose |
| :--- | :--- | :--- |
| [00-index.md](./00-index.md) | Event Documentation | Local file index, configuration guide, and session catalog for ARI 2026. |
| [index.html](./index.html) | Tier 2: Event Sub-Landing Page | Breadcrumbs, Miranza clinical hero banner, date, interactive compact agenda with live search and category filter, and embed code drawer. |
| [style.css](./style.css) | Event Sub-Landing Stylesheet | Styles for the hero header, search input, filter pills, and compact interactive agenda cards. |
| [config.json](./config.json) | Event Configuration | Defines Supabase endpoint/keys and YouTube broadcast IDs for all 21 event sessions. |
| [embed.js](./embed.js) | Embed Script | Host-page injection script for embedding the player via iframe and bridging Matomo analytics. |
| [player/index.html](./player/index.html) | Tier 3: Dedicated Player UI | Video player shell, top navigation bar (`← Agenda ARI 2026`), 21-session dropdown selector + smooth-scrolling pills, Option B controls, and 2-line subtitle box. |
| [player/script.js](./player/script.js) | Web Client Application Engine | Multi-path `config.json` loader with async gating (`tryInitYouTubePlayer`), dual dropdown/pill sync, YouTube IFrame API controller, Supabase Realtime & historical caption sync, and Matomo postMessage bridge. |
| [player/style.css](./player/style.css) | Web Client Design System | Responsive stylesheet supporting dark/light themes (`data-theme`), slim navigation bar, session dropdown, scrollable pills strip, Option B controls, and subtitle typography. |
| [player/config.json](./player/config.json) | Local Config Mirror | Direct config access for client-side relative fetch (`./config.json`). |

---

## Configuration Summary

- **Supabase Project URL**: `https://yzxnkotfjatpfflklaer.supabase.co`
- **Anon Key**: `sb_publishable_HZZzfG8MIfSdB4IYhK3INw_ilgSFZLB`
- **Broadcast Sessions (21 Total)**:
  - `Presentacion_ARI26`: `SebWltYihZI` (Presentación Inaugural ARI 2026)
  - `session_1`: `perc_9X3Iow` (Sesión 1 - Actualización Clínica & Cirugía Refractiva)
  - `session_satellite_Essilor`: `WvSEDu41MIo` (Simposio Satélite - Essilor)
  - `session_2`: `BiMVvxw2DQk` (Sesión 2 - Córnea y Superficie Ocular)
  - `session_satellite_Topcon`: `Vl0H-pfMOFA` (Simposio Satélite - Topcon)
  - `session_3`: `vqwEZBrixYY` (Sesión 3 - Avances en Diagnóstico e Imagen)
  - `session_satellite_CSO`: `nU-a1pcO0CU` (Simposio Satélite - CSO)
  - `session_4`: `EHLbE6UJ9m0` (Sesión 4 - Lentes Intraoculares Premium & Presbicia)
  - `session_satellite_biotech`: `ivt11CSJf8w` (Simposio Satélite - Biotech)
  - `session_5`: `tdGFahuTWk4` (Sesión 5 - Técnicas Quirúrgicas de Precisión)
  - `session_satellite_ophtalmic`: `wTn7XlyMKDY` (Simposio Satélite - Ophthalmic)
  - `session_6`: `njToIL1CDuI` (Sesión 6 - Casos Complejos y Manejo de Complicaciones)
  - `session_7`: `FiZzPB0ob1U` (Sesión 7 - Retina Médica y Quirúrgica)
  - `session_8`: `oqgE4dDvaVI` (Sesión 8 - Glaucoma y Presión Intraocular)
  - `session_satellite_ophtec`: `d6e-K6sUdy8` (Simposio Satélite - Ophtec)
  - `session_9`: `BmBr0Ito6XA` (Sesión 9 - Innovación Biomédica y Nuevos Tratamientos)
  - `session_satellite_alcon`: `Aq2E3oa51q8` (Simposio Satélite - Alcon)
  - `session_10`: `m3LiBvZhPaA` (Sesión 10 - Cirugía de Cristalino y Facoemulsificación)
  - `session_11`: `ltcuPwJz9nE` (Sesión 11 - Mesa Redonda y Controversias)
  - `session_satellite_Jonhson`: `LT8uikrWbhM` (Simposio Satélite - Johnson & Johnson)
  - `Clausura_ARI26`: `RvUh-qvGbpg` (Clausura y Conclusiones ARI 2026)

---

## Access Paths

When served by the platform web server (`server.js`):
- **Event Sub-Landing (Agenda)**: `/26-10-22_ARI26/`
- **Dedicated Player by Session**: `/26-10-22_ARI26/player/?session=<session_id>` (e.g. `?session=session_1` or `?session=Presentacion_ARI26`)
- **Embed Script Source**: `/26-10-22_ARI26/embed.js`
- **Configuration Endpoint**: `/26-10-22_ARI26/config.json`
