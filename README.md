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

## License

MIT — use it however you want. If you're a radio station using this, we'd love to hear about it!

## Credits

Built by [WispAyr](https://github.com/WispAyr) / Local Connect
