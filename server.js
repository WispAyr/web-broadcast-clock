// server.js — Dev server with Icecast proxy and NTP-style time endpoint
// Port 3970

import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3970;

// ─── Static files ───────────────────────────────────────────
app.use('/src', express.static(join(__dirname, 'src')));
app.use('/demo', express.static(join(__dirname, 'demo')));
app.use('/presets', express.static(join(__dirname, 'presets')));
app.use('/dist', express.static(join(__dirname, 'dist')));

// Redirect root to demo
app.get('/', (req, res) => res.redirect('/demo/'));

// ─── Time Sync Endpoint ────────────────────────────────────
// Returns server time for NTP-style client sync.
// NOTE: For production broadcast use, the server should run ntpd
// synced to stratum-1 NTP sources (e.g. pool.ntp.org, GPS-disciplined).
// Date.now() on most Linux/macOS systems is kept accurate by ntpd/chrony
// to within ~1-10ms of UTC. For microsecond accuracy, use PTP (IEEE 1588).
app.get('/api/time', (req, res) => {
  res.json({
    serverTime: Date.now(),
    precision: 'ntp',
    note: 'Server time sourced from system clock. Ensure ntpd/chrony is running for broadcast accuracy.',
  });
});

// ─── Icecast Now-Playing Proxy ──────────────────────────────
// Proxies to avoid CORS restrictions on Icecast status endpoints.
app.get('/api/now-playing', async (req, res) => {
  const ICECAST_URL = process.env.ICECAST_URL ||
    'https://uksoutha.streaming.broadcast.radio:30590/status-json.xsl';
  const MOUNT = process.env.ICECAST_MOUNT || '/nowayrshireradio';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(ICECAST_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ artist: '', title: '', listeners: 0, error: 'Icecast returned ' + response.status });
    }

    const data = await response.json();
    const sources = data?.icestats?.source;
    if (!sources) {
      return res.json({ artist: '', title: '', listeners: 0 });
    }

    // Find our mount (handle single source or array)
    const sourceList = Array.isArray(sources) ? sources : [sources];
    const source = sourceList.find(s =>
      s.listenurl?.includes(MOUNT) || s.server_name?.includes('nowayrshire')
    ) || sourceList[0];

    if (!source) {
      return res.json({ artist: '', title: '', listeners: 0 });
    }

    // Parse artist/title from StreamTitle
    // Handles "Artist - Title" and "Title by Artist" formats
    const streamTitle = source.title || source.yp_currently_playing || '';
    let artist = '';
    let title = streamTitle;
    const dashIdx = streamTitle.indexOf(' - ');
    if (dashIdx > 0) {
      artist = streamTitle.substring(0, dashIdx).trim();
      title = streamTitle.substring(dashIdx + 3).trim();
    } else {
      const byIdx = streamTitle.lastIndexOf(' by ');
      if (byIdx > 0) {
        title = streamTitle.substring(0, byIdx).trim();
        artist = streamTitle.substring(byIdx + 4).trim();
      }
    }

    res.json({
      artist,
      title,
      listeners: source.listeners || 0,
      bitrate: source.bitrate || null,
      genre: source.genre || '',
      raw: streamTitle,
    });
  } catch (err) {
    res.json({ artist: '', title: '', listeners: 0, error: err.message });
  }
});

// ─── Start ──────────────────────────────────────────────────
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`\n  🕐 Broadcast Clock dev server`);
  console.log(`  ➜ http://localhost:${PORT}/`);
  console.log(`  ➜ http://localhost:${PORT}/demo/`);
  console.log(`  ➜ Time sync: http://localhost:${PORT}/api/time`);
  console.log(`  ➜ Now playing: http://localhost:${PORT}/api/now-playing\n`);
});
