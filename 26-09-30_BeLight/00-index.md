# Event Index: 26-09-30_BeLight

Index of files created and configured for the **Be-Light** event (Date: 2026-09-30) within the **EVENTOS-IMO** platform.

---

## Files Overview

| File | Description | Purpose |
| :--- | :--- | :--- |
| [00-index.md](./00-index.md) | Event Index | Local file index and component documentation for the Be-Light event. |
| [config.json](./config.json) | Event Configuration | Defines Supabase endpoint/keys and YouTube broadcast IDs for `session_1` and `session_2`. |
| [embed.js](./embed.js) | Embed Script | Host-page injection script for embedding the player via iframe and bridging Matomo analytics. |
| [Client/index.html](./Client/index.html) | Player HTML | Web player UI with custom controls, subtitle display box, and language selection. |
| [Client/script.js](./Client/script.js) | Player Logic | Manages YouTube IFrame API, Supabase Realtime captions, TTS audio, and Matomo tracking. |
| [Client/style.css](./Client/style.css) | Player Styling | Dark/light theme definitions, control layout, responsive player and subtitle box styling. |
| [Client/config.json](./Client/config.json) | Local Config Mirror | Direct config access for client-side relative fetch (`./config.json`). |

---

## Configuration Summary

- **Supabase Project URL**: `https://kcdhrxtbylpaceeoglpq.supabase.co`
- **Broadcast Sessions**:
  - `session_1`: `JVe72x6qjfo`
  - `session_2`: `XZ6oYuFedCk`

---

## Access Paths

When served by the platform web server (`server.js`):
- **Direct Event Player**: `/26-09-30_BeLight/Client/index.html?session=session_1` (or `?session=session_2`)
- **Direct Subpath Alias**: `/26-09-30_BeLight/?session=session_1`
- **Embed Script Source**: `/26-09-30_BeLight/embed.js`
- **Configuration Endpoint**: `/26-09-30_BeLight/config.json`
