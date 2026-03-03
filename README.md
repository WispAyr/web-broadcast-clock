# Web Broadcast Clock

A modern, web-based broadcast clock for radio studios. Configurable, real-time, and beautiful.

## Features

- 🕐 **Circular broadcast clock** with configurable segments (music, ads, news, talk, jingles)
- ⏱️ **Real-time sweep** showing current position in the hour
- 🎵 **Now Playing** integration via Icecast/Shoutcast metadata
- 📊 **Show info** from WordPress/custom APIs
- 🎨 **Fully customisable** — colours, segments, layout via JSON config
- 📱 **Responsive** — works on any screen size, portrait or landscape
- 🌙 **Dark mode** — designed for studio environments
- 🔌 **Embeddable** — drop into any web page or kiosk display
- 🆓 **Open source** — MIT license

## Use Cases

- Community radio studio displays
- Internet radio dashboards
- Student/university radio
- Hospital/prison radio
- Podcast studio timing
- Any broadcast environment needing visual timing

## Quick Start

```bash
npm install web-broadcast-clock
```

Or include directly:
```html
<script src="https://unpkg.com/web-broadcast-clock/dist/broadcast-clock.min.js"></script>
<broadcast-clock config="/my-clock-config.json"></broadcast-clock>
```

## Configuration

```json
{
  "segments": [
    { "start": 0, "end": 3, "type": "news", "label": "News Bulletin" },
    { "start": 3, "end": 15, "type": "music", "label": "Music Set 1" },
    { "start": 15, "end": 18, "type": "ads", "label": "Ad Break 1" },
    { "start": 18, "end": 30, "type": "music", "label": "Music Set 2" },
    { "start": 30, "end": 33, "type": "news", "label": "Headlines" },
    { "start": 33, "end": 45, "type": "music", "label": "Music Set 3" },
    { "start": 45, "end": 48, "type": "ads", "label": "Ad Break 2" },
    { "start": 48, "end": 55, "type": "music", "label": "Music Set 4" },
    { "start": 55, "end": 58, "type": "talk", "label": "Back Anno / Intro" },
    { "start": 58, "end": 60, "type": "jingle", "label": "Station ID" }
  ],
  "colours": {
    "music": "#3b82f6",
    "ads": "#ef4444",
    "news": "#22c55e",
    "talk": "#f59e0b",
    "jingle": "#8b5cf6",
    "weather": "#06b6d4"
  },
  "showInfo": {
    "enabled": true,
    "source": "icecast",
    "url": "https://your-stream.example.com:8000/status-json.xsl"
  }
}
```

## Integrations

| Source | Type | What You Get |
|--------|------|-------------|
| **Icecast/Shoutcast** | Stream metadata | Now playing (artist/title), listener count |
| **WordPress (ProRadio)** | REST API | Show schedule, presenter info, show art |
| **Custom API** | JSON endpoint | Any metadata you want to display |
| **Manual** | JSON config | Static clock templates |

## Development

```bash
git clone https://github.com/WispAyr/web-broadcast-clock.git
cd web-broadcast-clock
npm install
npm run dev
```

## Precision Timing

The broadcast clock includes NTP-style server synchronisation out of the box (±5-20ms accuracy). For environments requiring broadcast-grade timing, several advanced options are supported:

### Standard (default)
- Server time sync via `/api/time` endpoint
- `requestAnimationFrame` for jitter-free rendering
- `performance.now()` monotonic timekeeping
- Web Worker background clock (immune to tab throttling)
- **Accuracy: ±5-20ms**

### GPS NTP Server (recommended for broadcast)
Add a GPS receiver to your network for stratum-1 NTP accuracy:

```
GPS Receiver → Raspberry Pi (chrony) → LAN NTP server
                                            ↓
                        Studio PCs sync to Pi → ±1ms accuracy
```

**Hardware needed:** Raspberry Pi + GPS HAT with PPS (e.g., Adafruit Ultimate GPS HAT, ~£25)

**Setup:**
```bash
# On the Pi
sudo apt install chrony gpsd gpsd-clients
# Configure chrony to use GPS+PPS as reference clock
# Configure studio PCs to use Pi as NTP server
```

The broadcast clock server will automatically use the host's NTP-synced time. No code changes needed — just point your PCs at the GPS Pi for NTP.

### Starlink GPS Passthrough
If your studio has a Starlink dish, it contains a GPS receiver with atomic-clock-grade satellite timing. The dish is accessible at `192.168.100.1` via gRPC and exposes:

- `gps_ready` / `gps_valid` — GPS lock status
- `gps_sats` — number of satellites tracked
- Location data (when enabled in Starlink app → Settings → Advanced → Debug Data → Allow access on local network)

The dish's internal clock is GPS-disciplined for satellite beam handoffs. To leverage this:

1. **Enable location sharing** in the Starlink app (Settings → Advanced → Debug Data)
2. **Query the dish** via gRPC tools: `pip install starlink-grpc-tools`
3. **Use the dish as NTP source** — some firmware versions expose NTP at `192.168.100.1`
4. **Combine with a local Pi** running chrony that queries both the dish and public NTP pools

```bash
# Test if your Starlink dish serves NTP
ntpdate -q 192.168.100.1

# Query GPS status via gRPC
python3 dish_grpc_text.py location
```

See [starlink-grpc-tools](https://github.com/sparky8512/starlink-grpc-tools) for full dish API documentation.

### Timing Architecture

```
┌─────────────────────────────────────────────┐
│  GPS Satellites (atomic clocks)             │
│         ↓                    ↓              │
│  Starlink Dish          GPS HAT on Pi       │
│  (192.168.100.1)        (PPS signal)        │
│         ↓                    ↓              │
│    ┌─── LAN NTP Server (chrony) ───┐        │
│    ↓              ↓                ↓        │
│  Studio PC 1   Studio PC 2   Studio PC 3   │
│  (Screen 1)    (Screen 2)    (Screen 3)    │
│    ↓              ↓                ↓        │
│  Broadcast     Broadcast      Broadcast     │
│  Clock App     Clock App      Clock App     │
│    ↓                                        │
│  /api/time → NTP-synced server time         │
│  Web Worker → monotonic background clock    │
│  rAF → smooth 60fps sweep rendering         │
└─────────────────────────────────────────────┘
```

**Result:** All three studio screens display identical time, accurate to within 1ms of UTC, with smooth 60fps animation.

## License

MIT — use it however you want. If you're a radio station using this, we'd love to hear about it!

## Credits

Built by [WispAyr](https://github.com/WispAyr) / Local Connect
