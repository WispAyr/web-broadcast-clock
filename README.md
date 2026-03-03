# 🕐 Web Broadcast Clock

A modern, web-based broadcast clock for radio studios. Real-time, configurable, precision-timed, and beautiful.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- 🕐 **Circular broadcast clock** — 360° = 60 minutes, coloured segments for music, ads, news, talk, jingles
- ⏱️ **60fps sweep hand** — smooth `requestAnimationFrame` rendering, zero jitter
- 🎯 **Precision timing** — NTP-style server sync, Web Worker background timekeeping, accurate to <10ms
- 🎵 **Now Playing** — Icecast/Shoutcast metadata integration via CORS proxy
- 🎨 **Fully configurable** — JSON config for segments, colours, show info
- 📦 **Web Component** — drop `<broadcast-clock>` into any page
- 📱 **Responsive** — works at 200px to 800px+
- 🌙 **Dark theme** — designed for studio environments, readable from 3m away
- 🆓 **Open source** — MIT license, no dependencies for the clock itself

## Quick Start

```bash
git clone https://github.com/WispAyr/web-broadcast-clock.git
cd web-broadcast-clock
npm install
npm start
# → http://localhost:3970/
```

## Usage

### Standalone (kiosk/signage)

Just open `demo/index.html` or run the dev server. Full-screen in a browser for studio display.

### Web Component

```html
<script type="module" src="src/index.js"></script>
<broadcast-clock config-url="config.json" size="500"></broadcast-clock>
```

### JavaScript API

```javascript
import { init } from './src/index.js';

const canvas = document.getElementById('my-canvas');
const { clock, metadata } = init(canvas, {
  segments: [
    { start: 0, end: 15, type: 'music', label: 'Music Set 1' },
    { start: 15, end: 18, type: 'ads', label: 'Ad Break' },
    // ...
  ],
  timing: {
    syncEnabled: true,
    syncEndpoint: '/api/time',
  },
});

// Update now playing manually
clock.setNowPlaying({ artist: 'Holly Valance', title: 'Kiss Kiss' });
```

## Configuration

See `demo/config-default.json` for the full schema. Key sections:

| Section | Description |
|---------|-------------|
| `segments` | Array of `{ start, end, type, label, description }` — minutes within the hour |
| `colours` | Map of segment type → hex colour |
| `metadata.icecast` | Icecast stream URL, mount, poll interval |
| `show` | Current show name, presenter |
| `display` | Toggle labels, time, now-playing, next segment |
| `timing` | NTP sync endpoint, interval, sync status indicator |

### Segment Types

| Type | Default Colour | Use |
|------|---------------|-----|
| `music` | 🟦 `#3b82f6` | Music sets |
| `ads` | 🟥 `#ef4444` | Ad breaks |
| `news` | 🟩 `#22c55e` | News bulletins |
| `talk` | 🟨 `#f59e0b` | Talk/chat/links |
| `jingle` | 🟪 `#8b5cf6` | Jingles, IDs, sweepers |
| `weather` | 🩵 `#06b6d4` | Weather reports |
| `intro` | 💗 `#ec4899` | Show intros |

## Presets

Four built-in presets in `presets/`:

- **community-radio.json** — Standard community radio hour (Now Ayrshire Radio)
- **commercial-radio.json** — Commercial FM with heavy ad breaks
- **talk-radio.json** — Talk/interview format
- **music-station.json** — Automated music station, minimal breaks

## Precision Timing

The clock uses a multi-layer timing strategy for broadcast-grade accuracy:

1. **Web Worker** — maintains authoritative time in a background thread, immune to tab throttling
2. **NTP-style sync** — on load, 3 round-trip samples to `/api/time`, picks lowest RTT, calculates offset
3. **Re-sync every 60s** — silent background correction
4. **`performance.now()` interpolation** — microsecond-resolution smoothing between worker ticks
5. **`requestAnimationFrame` only** — no setInterval for rendering, guaranteed vsync

Sync status indicator: 🟢 <10ms | 🟡 10-100ms | 🔴 >100ms or no sync

For production: run `ntpd` or `chrony` on the server, synced to stratum-1 sources.

## Dev Server

Port 3970 (configurable via `PORT` env var).

| Endpoint | Description |
|----------|-------------|
| `GET /` | Redirects to demo |
| `GET /demo/` | Full demo page |
| `GET /api/time` | Server time for NTP sync |
| `GET /api/now-playing` | Icecast metadata proxy |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Toggle side panel |

## License

MIT
