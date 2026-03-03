// clock.js — Core broadcast clock Canvas renderer
// Uses requestAnimationFrame exclusively for rendering.
// Time source: Web Worker corrected time + performance.now() interpolation.

import { getSegmentAt, getNextSegment } from './config.js';

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const DEG_PER_MIN = TAU / 60;
const GAP_RAD = (1.5 * Math.PI) / 180; // 1.5° gap between segments

export class BroadcastClock {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.segments = config.segments || [];
    this.colours = config.colours || {};
    this.display = config.display || {};
    this.timing = config.timing || {};

    // Time state — updated by worker, interpolated by rAF
    this._workerTime = Date.now();
    this._workerPerfStamp = performance.now();
    this._syncStatus = 'unsynced';
    this._syncRtt = Infinity;

    // Interaction
    this._hoveredSegment = null;
    this._selectedSegment = null;
    this._tooltip = { visible: false, x: 0, y: 0, text: '' };

    // Metadata
    this._nowPlaying = { artist: '', title: '' };
    this._showInfo = config.show || {};

    // Worker
    this._worker = null;
    this._rafId = null;

    this._setupCanvas();
    this._setupEvents();
    this._startWorker();
    this._startRender();
  }

  // ─── Precision Time ───────────────────────────────────────

  /** Corrected current time using worker time + performance.now() interpolation */
  _now() {
    const elapsed = performance.now() - this._workerPerfStamp;
    return this._workerTime + elapsed;
  }

  _startWorker() {
    // Build worker from source — inline blob so no extra file needed at runtime
    // But we also support loading from URL for bundled builds
    try {
      const workerUrl = new URL('./clock-worker.js', import.meta.url);
      this._worker = new Worker(workerUrl, { type: 'module' });
    } catch (e) {
      // Fallback: inline worker with setInterval
      this._worker = null;
      this._fallbackTicker();
      return;
    }

    this._worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'tick') {
        this._workerTime = msg.time;
        this._workerPerfStamp = performance.now();
      } else if (msg.type === 'sync') {
        this._syncStatus = msg.status;
        this._syncRtt = msg.rtt;
      }
    };

    const syncEndpoint = this.timing.syncEnabled !== false
      ? (this.timing.syncEndpoint || '/api/time')
      : null;

    this._worker.postMessage({
      type: 'init',
      syncEndpoint,
      syncInterval: this.timing.syncInterval || 60000,
    });
  }

  _fallbackTicker() {
    // No worker support — just use Date.now() directly
    setInterval(() => {
      this._workerTime = Date.now();
      this._workerPerfStamp = performance.now();
    }, 100);
  }

  // ─── Canvas Setup ─────────────────────────────────────────

  _setupCanvas() {
    this._resize();
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this.canvas.parentElement || this.canvas);
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const size = parent
      ? Math.min(parent.clientWidth, parent.clientHeight)
      : Math.min(this.canvas.width, this.canvas.height);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.size = size;
    this.dpr = dpr;
    this.cx = (size * dpr) / 2;
    this.cy = (size * dpr) / 2;
    this.radius = (size * dpr) / 2 * 0.92;
  }

  // ─── Events ───────────────────────────────────────────────

  _setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouse(e));
    this.canvas.addEventListener('mouseleave', () => {
      this._hoveredSegment = null;
      this._tooltip.visible = false;
    });
    this.canvas.addEventListener('click', (e) => this._onClick(e));
  }

  _getMinuteFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * this.dpr - this.cx;
    const y = (e.clientY - rect.top) * this.dpr - this.cy;
    const dist = Math.sqrt(x * x + y * y);
    if (dist < this.radius * 0.35 || dist > this.radius * 1.05) return -1;
    let angle = Math.atan2(y, x) + HALF_PI;
    if (angle < 0) angle += TAU;
    return (angle / TAU) * 60;
  }

  _onMouse(e) {
    const minute = this._getMinuteFromEvent(e);
    if (minute < 0) {
      this._hoveredSegment = null;
      this._tooltip.visible = false;
      return;
    }
    const seg = getSegmentAt(this.segments, minute);
    this._hoveredSegment = seg;
    if (seg) {
      this._tooltip = {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        text: `${seg.label} (${seg.start}:00–${seg.end}:00)\n${seg.description || seg.type}`,
      };
    }
  }

  _onClick(e) {
    const minute = this._getMinuteFromEvent(e);
    if (minute < 0) { this._selectedSegment = null; return; }
    this._selectedSegment = getSegmentAt(this.segments, minute);
  }

  // ─── Public API ───────────────────────────────────────────

  setNowPlaying(data) {
    this._nowPlaying = { ...this._nowPlaying, ...data };
  }

  setConfig(config) {
    this.config = config;
    this.segments = config.segments || [];
    this.colours = config.colours || {};
    this.display = config.display || {};
    this._showInfo = config.show || {};
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._worker) this._worker.postMessage({ type: 'stop' });
    if (this._resizeObserver) this._resizeObserver.disconnect();
  }

  // ─── Render Loop (rAF only) ──────────────────────────────

  _startRender() {
    const frame = () => {
      this._render();
      this._rafId = requestAnimationFrame(frame);
    };
    this._rafId = requestAnimationFrame(frame);
  }

  _render() {
    const ctx = this.ctx;
    const now = this._now();
    const date = new Date(now);
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();
    const exactMinute = minutes + seconds / 60 + ms / 60000;

    const cx = this.cx;
    const cy = this.cy;
    const r = this.radius;

    // Clear
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const currentSeg = getSegmentAt(this.segments, exactMinute);
    const nextSeg = getNextSegment(this.segments, exactMinute);

    // Draw segments
    this._drawSegments(ctx, cx, cy, r, exactMinute, currentSeg);

    // Minute markers
    this._drawMinuteMarkers(ctx, cx, cy, r);

    // Sweep hand
    this._drawSweepHand(ctx, cx, cy, r, exactMinute);

    // Centre circle
    this._drawCentre(ctx, cx, cy, r, date, currentSeg, nextSeg, exactMinute);

    // Sync indicator
    if (this.timing.showSyncStatus !== false) {
      this._drawSyncIndicator(ctx, cx, cy, r);
    }

    // Tooltip (rendered as overlay)
    this._drawTooltip(ctx);
  }

  _drawSegments(ctx, cx, cy, r, exactMinute, currentSeg) {
    const outerR = r;
    const innerR = r * 0.55;
    const labelR = r * 0.75;

    for (const seg of this.segments) {
      const startAngle = (seg.start / 60) * TAU - HALF_PI + GAP_RAD / 2;
      const endAngle = (seg.end / 60) * TAU - HALF_PI - GAP_RAD / 2;
      const baseColour = this.colours[seg.type] || '#666';
      const isCurrent = currentSeg === seg;
      const isHovered = this._hoveredSegment === seg;
      const isSelected = this._selectedSegment === seg;

      // Gradient: lighter at outer edge
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      const alpha = isCurrent ? 1.0 : isHovered ? 0.9 : 0.7;
      grad.addColorStop(0, this._rgba(baseColour, alpha * 0.8));
      grad.addColorStop(1, this._rgba(baseColour, alpha));

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Current segment glow
      if (isCurrent) {
        ctx.save();
        ctx.shadowColor = baseColour;
        ctx.shadowBlur = 20 * this.dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.strokeStyle = this._rgba(baseColour, 0.6);
        ctx.lineWidth = 2 * this.dpr;
        ctx.stroke();
        ctx.restore();
      }

      // Segment border
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1 * this.dpr;
      ctx.stroke();

      // Labels for segments wider than 4 minutes
      if (this.display.showLabels && (seg.end - seg.start) >= 4) {
        const midAngle = ((seg.start + seg.end) / 2 / 60) * TAU - HALF_PI;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        const fontSize = Math.max(9, Math.min(14, this.size / 40)) * this.dpr;
        ctx.save();
        ctx.font = `${isCurrent ? 'bold ' : ''}${fontSize}px "Inter", "SF Pro", system-ui, sans-serif`;
        ctx.fillStyle = isCurrent ? '#fff' : 'rgba(255,255,255,0.75)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Rotate text to follow arc
        ctx.translate(lx, ly);
        let rot = midAngle + HALF_PI;
        if (rot > HALF_PI && rot < HALF_PI + Math.PI) rot += Math.PI;
        ctx.rotate(rot);
        ctx.fillText(seg.label, 0, 0);
        ctx.restore();
      }
    }
  }

  _drawMinuteMarkers(ctx, cx, cy, r) {
    const outerR = r * 1.02;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * TAU - HALF_PI;
      const isMajor = i % 5 === 0;
      const innerR = isMajor ? r * 0.95 : r * 0.97;
      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = (isMajor ? 2 : 1) * this.dpr;
      ctx.stroke();

      // Number labels at 5-minute marks
      if (isMajor) {
        const numR = r * 1.08;
        const nx = cx + Math.cos(angle) * numR;
        const ny = cy + Math.sin(angle) * numR;
        const fontSize = Math.max(10, this.size / 35) * this.dpr;
        ctx.font = `bold ${fontSize}px "Inter", "SF Pro", system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i), nx, ny);
      }
    }
  }

  _drawSweepHand(ctx, cx, cy, r, exactMinute) {
    const angle = (exactMinute / 60) * TAU - HALF_PI;
    const handR = r * 1.0;
    const tailR = r * 0.15;

    // Glow
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12 * this.dpr;

    // Hand line
    ctx.beginPath();
    ctx.moveTo(
      cx + Math.cos(angle + Math.PI) * tailR,
      cy + Math.sin(angle + Math.PI) * tailR,
    );
    ctx.lineTo(
      cx + Math.cos(angle) * handR,
      cy + Math.sin(angle) * handR,
    );
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5 * this.dpr;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tip dot
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(angle) * handR,
      cy + Math.sin(angle) * handR,
      3 * this.dpr, 0, TAU,
    );
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Centre pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 4 * this.dpr, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  _drawCentre(ctx, cx, cy, r, date, currentSeg, nextSeg, exactMinute) {
    const innerR = r * 0.50;

    // Dark centre circle
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
    grad.addColorStop(0, 'rgba(10, 14, 26, 0.98)');
    grad.addColorStop(1, 'rgba(10, 14, 26, 0.92)');
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, TAU);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1 * this.dpr;
    ctx.stroke();

    // Time — HH:MM:SS (smooth seconds via ms-accurate time)
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    const timeFontSize = Math.max(16, this.size / 10) * this.dpr;
    ctx.font = `bold ${timeFontSize}px "JetBrains Mono", "SF Mono", "Consolas", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeStr, cx, cy - innerR * 0.18);

    // Current segment name
    if (currentSeg) {
      const segFontSize = Math.max(10, this.size / 22) * this.dpr;
      ctx.font = `600 ${segFontSize}px "Inter", "SF Pro", system-ui, sans-serif`;
      const segColour = this.colours[currentSeg.type] || '#888';
      ctx.fillStyle = segColour;
      ctx.fillText(currentSeg.label, cx, cy + innerR * 0.15);

      // Time remaining
      const remainMin = currentSeg.end - exactMinute;
      const remM = Math.floor(remainMin);
      const remS = Math.floor((remainMin - remM) * 60);
      const remStr = `${remM}:${String(remS).padStart(2, '0')} remaining`;
      const remFontSize = Math.max(8, this.size / 32) * this.dpr;
      ctx.font = `${remFontSize}px "Inter", "SF Pro", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(remStr, cx, cy + innerR * 0.40);
    }

    // Next segment hint
    if (nextSeg && this.display.showNextSegment) {
      const nextMin = nextSeg.start - exactMinute;
      const nM = nextMin < 0 ? nextMin + 60 : nextMin;
      const nMins = Math.floor(nM);
      const nSecs = Math.floor((nM - nMins) * 60);
      const nextStr = `Next: ${nextSeg.label} in ${nMins}:${String(nSecs).padStart(2, '0')}`;
      const nextFontSize = Math.max(7, this.size / 38) * this.dpr;
      ctx.font = `${nextFontSize}px "Inter", "SF Pro", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(nextStr, cx, cy + innerR * 0.60);
    }
  }

  _drawSyncIndicator(ctx, cx, cy, r) {
    const x = cx + r * 0.88;
    const y = cy - r * 0.88;
    const dotR = 4 * this.dpr;
    const colour =
      this._syncStatus === 'synced' ? '#22c55e' :
      this._syncStatus === 'degraded' ? '#f59e0b' : '#ef4444';

    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, TAU);
    ctx.fillStyle = colour;
    ctx.fill();

    // Subtle label
    const fs = Math.max(7, this.size / 50) * this.dpr;
    ctx.font = `${fs}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._syncStatus === 'synced' ? 'SYNC' : this._syncStatus === 'degraded' ? 'SYNC ~' : 'NO SYNC', x - dotR * 2, y);
    ctx.textAlign = 'center'; // reset
  }

  _drawTooltip(ctx) {
    if (!this._tooltip.visible || !this._hoveredSegment) return;
    // Tooltip rendered via DOM overlay is better — but canvas fallback here
    const seg = this._hoveredSegment;
    const text = `${seg.label}  (${seg.start}:00 – ${seg.end}:00)`;
    const desc = seg.description || seg.type;

    const pad = 8 * this.dpr;
    const fs = Math.max(10, this.size / 35) * this.dpr;
    ctx.font = `${fs}px "Inter", system-ui, sans-serif`;
    const tw = Math.max(ctx.measureText(text).width, ctx.measureText(desc).width) + pad * 2;
    const th = fs * 2.5 + pad * 2;

    // Position near top-right
    const tx = this.cx + this.radius * 0.3;
    const ty = this.cy - this.radius * 0.85;

    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    this._roundRect(ctx, tx, ty, tw, th, 6 * this.dpr);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${fs}px "Inter", system-ui, sans-serif`;
    ctx.fillText(text, tx + pad, ty + pad);
    ctx.font = `${fs * 0.85}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(desc, tx + pad, ty + pad + fs * 1.3);
    ctx.textAlign = 'center'; // reset
  }

  _roundRect(ctx, x, y, w, h, rad) {
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  _rgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
