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

### Advanced: GPS NTP Server

For dedicated broadcast environments, add a GPS receiver to your LAN:

```
GPS Receiver → Raspberry Pi (chrony) → LAN NTP server → ±1ms accuracy
```

**Hardware:** Raspberry Pi + GPS HAT with PPS (~£25, e.g. Adafruit Ultimate GPS HAT)

### Advanced: Starlink as Stratum-1 NTP (confirmed working!)

If your studio is on Starlink, the dish at `192.168.100.1` is already a GPS-disciplined NTP server — no extra hardware needed. **Tested: ±0.48ms precision** with 18 GPS satellites locked:

```bash
$ sntp 192.168.100.1
+0.010712 +/- 0.000483 192.168.100.1
```

Point your server's NTP at the dish:
```bash
# Linux (chrony) — add to /etc/chrony/chrony.conf:
server 192.168.100.1 iburst prefer

# macOS
sudo sntp -sS 192.168.100.1
```

The dish also exposes gRPC at `192.168.100.1:9200`:
```bash
grpcurl -plaintext -d '{"get_status":{}}' 192.168.100.1:9200 SpaceX.API.Device.Device.Handle
# Returns: gpsStats.gpsValid, gpsStats.gpsSats (15-20 typical), uptimeS
```

### Timing Architecture

```
┌──────────────────────────────────────────────────┐
│  GPS Satellites (atomic clocks)                  │
│         ↓                    ↓                   │
│  Starlink Dish          GPS HAT on Pi            │
│  (192.168.100.1)        (PPS signal)             │
│    NTP: ±0.5ms          NTP: ±1μs               │
│         ↓                    ↓                   │
│    ┌─── LAN NTP Server (chrony) ───┐             │
│    ↓              ↓                ↓             │
│  Studio PC 1   Studio PC 2   Studio PC 3        │
│    ↓              ↓                ↓             │
│  Web Worker → performance.now() → rAF → Canvas  │
│  (±0.5ms)     (±5μs resolution)   (60fps)       │
└──────────────────────────────────────────────────┘
```

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
